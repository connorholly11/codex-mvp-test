'use client';

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/use-chat-store';
import { useOnboardingStore } from '@/store/use-onboarding-store';
import { useSessionStore } from '@/store/use-session-store';
import { YouReportCard } from '@/features/chat/components/you-report-card';
import type { ChatMessage } from '@/store/use-chat-store';
import type { OnboardingData } from '@/features/onboarding/types';
import { generatePersonalInsights, buildPersonalInsightsReport } from '@/lib/reports';
import { logEvent } from '@/lib/analytics';

export function ChatRoot() {
  const router = useRouter();
  const onboardingData = useOnboardingStore((state) => state.data);
  const messages = useChatStore((state) => state.messages);
  const appendMessage = useChatStore((state) => state.appendMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const user = useSessionStore((state) => state.user);

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user?.legalAcceptedAt) {
      router.replace('/onboarding');
    }
  }, [router, user?.legalAcceptedAt]);

  useEffect(() => {
    if (messages.length === 0 && user?.legalAcceptedAt) {
      const greeting = buildGreeting(onboardingData, user?.name ?? 'there');
      appendMessage(createMessage('assistant', greeting, { type: 'greeting' }));
      injectReportMessages(onboardingData, appendMessage, messages);
    }
  }, [messages, appendMessage, onboardingData, user?.name, user?.legalAcceptedAt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) {
      return;
    }
    setInput('');
    const userMessage = createMessage('user', trimmed);
    appendMessage(userMessage);
    logEvent('chat_message_sent', { length: trimmed.length });
    setIsStreaming(true);

    const assistantId = randomId('assistant');
    const placeholder = { ...createMessage('assistant', ''), id: assistantId };
    placeholder.pending = true;
    appendMessage(placeholder);

  const responseSegments = buildAssistantResponse(trimmed, onboardingData);
  const [primary, ...rest] = responseSegments;
  if (!primary) {
    setIsStreaming(false);
    return;
  }
  streamMessage(primary, assistantId, updateMessage, () => {
    const totalLength = responseSegments.reduce((sum, segment) => sum + segment.length, 0);
    logEvent('chat_response_completed', { length: totalLength, segments: responseSegments.length });
      if (rest.length > 0) {
        rest.forEach((segment, index) => {
          window.setTimeout(() => {
            appendMessage(createMessage('assistant', segment));
          }, (index + 1) * 350);
        });
      }
      setIsStreaming(false);
    });
  };

  const headerSubtitle = useMemo(() => {
    if (!user?.name) {
      return 'Prototype chat experience';
    }
    return `Chatting as ${user.name}`;
  }, [user?.name]);

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">Chat with Fermi</h1>
        <p className="text-sm text-muted">{headerSubtitle}</p>
      </header>

      <YouReportCard data={onboardingData} />

      <div className="flex-1 overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex h-full flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {isStreaming ? <TypingIndicator /> : null}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSubmit} className="border-t border-border p-4">
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message to Fermi..."
                rows={1}
                className="min-h-[48px] flex-1 resize-none rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <button
                type="submit"
                disabled={isStreaming || input.trim().length === 0}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                ➤
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl bg-surface-muted px-4 py-3">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-2 w-2 animate-pulse rounded-full"
            style={{
              animationDelay: `${index * 120}ms`,
              backgroundColor: 'var(--color-muted)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm transition ${
          isUser
            ? 'rounded-br-sm bg-accent text-accent-foreground'
            : 'rounded-bl-sm bg-surface-muted text-foreground'
        } ${message.pending ? 'opacity-70' : ''}`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

function createMessage(
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, unknown>,
): ChatMessage {
  return {
    id: randomId(role),
    role,
    content,
    createdAt: new Date().toISOString(),
    metadata,
  };
}

function streamMessage(
  fullText: string,
  id: string,
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void,
  done: () => void,
) {
  const tokens = fullText.split(/(\s+)/).filter(Boolean);
  let index = 0;
  const interval = window.setInterval(() => {
    index += 1;
    const partial = tokens.slice(0, index).join('');
    updateMessage(id, { content: partial });
    if (index >= tokens.length) {
      window.clearInterval(interval);
      updateMessage(id, { pending: false });
      done();
    }
  }, 90);
}

function buildGreeting(data: OnboardingData, name: string) {
  const summary = generatePersonalInsights(data);
  const focus = summary.topValueLabel?.toLowerCase() ?? 'what matters most to you';
  return `Hey ${name}, I’m Fermi. I’ve reviewed your assessment and I’m ready to help you focus on ${focus} while making progress where it feels toughest.`;
}

function buildAssistantResponse(input: string, data: OnboardingData) {
  const summary = generatePersonalInsights(data);
  const focusArea = summary.growthAreaLabel?.toLowerCase() ?? 'the area that matters most';
  const constraint = summary.constraint;

  const opening = constraint
    ? `You mentioned that “${constraint}” is holding you back.`
    : `Thanks for sharing that.`;

  const second = `Let’s look at ${focusArea} and identify one small move you could make today. What feels like the next honest experiment you could try, even if it’s just a five-minute action?`;

  const third = summary.topValueLabel
    ? `Keep ${summary.topValueLabel.toLowerCase()} front and centre while you test it—alignment beats hustle.`
    : `As you test ideas, notice which ones feel genuinely energising versus performative.`;

  return [opening, second, third];
}

function injectReportMessages(
  data: OnboardingData,
  appendMessage: (message: ChatMessage) => void,
  existingMessages: ChatMessage[],
) {
  const hasReport = existingMessages.some((message) => message.metadata?.type === 'report-intro');
  if (hasReport) {
    return;
  }

  const report = buildPersonalInsightsReport(data);
  appendMessage(
    createMessage(
      'assistant',
      `Here’s the personalised report I created for you. I’ll keep referencing these highlights as we work together.`,
      { type: 'report-intro', reportId: 'personal-insights' },
    ),
  );

  report.sections.forEach((section, index) => {
    const plainContent = section.content.replace(/\*\*/g, '');
    appendMessage(
      createMessage(
        'assistant',
        `${section.title}:\n${plainContent}`,
        { type: 'report-section', reportId: 'personal-insights', sectionId: section.id, order: index },
      ),
    );
  });

  appendMessage(
    createMessage(
      'assistant',
      'You can open the full Personal Insights report anytime from the card above or the Reports section.',
      { type: 'report-cta' },
    ),
  );
}

function randomId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
