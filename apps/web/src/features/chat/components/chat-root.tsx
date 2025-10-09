'use client';

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { fetchChatHistory, streamChatMessage, type ChatMessage } from '@purpose/api-client';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser-client';
import {
  parsePersonalInsightsReport,
  type PersonalInsightsReport,
} from '@/lib/reports';
import { YouReportCard } from '@/features/chat/components/you-report-card';
import { useChatStore } from '@/store/use-chat-store';
import { useSessionStore } from '@/store/use-session-store';

export function ChatRoot() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<PersonalInsightsReport | null>(null);

  const { user, setUser, updateUser } = useSessionStore();
  const { setSessionId, messages, setMessages, appendMessage, updateMessage } =
    useChatStore();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        setIsLoading(true);
        const [history, auth] = await Promise.all([
          fetchChatHistory(),
          supabase.auth.getUser(),
        , router]);

        if (!active) {
          return;
        }

        setSessionId(history.chatSessionId);
        setMessages(history.messages);
        setReport(
          history.report?.content
            ? parsePersonalInsightsReport(history.report.content)
            : null,
        );

        if (auth.data.user) {
          setUser({
            id: auth.data.user.id,
            email: auth.data.user.email ?? '',
            displayName:
              history.profile?.display_name ??
              (auth.data.user.user_metadata?.full_name as string | null) ??
              null,
            legalAcceptedAt: history.profile?.legal_acceptance_at ?? null,
          });
        }

        setIsLoading(false);
      } catch (error) {
        if (!active) {
          return;
        }
        console.error('Failed to load chat history', error);
        const message = error instanceof Error ? error.message : 'Failed to load chat';
        if (message.toLowerCase().includes('unauthorized')) {
          router.replace('/onboarding');
          return;
        }
        setError(message);
        setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [router, setMessages, setSessionId, setUser, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (!user?.legalAcceptedAt) {
      router.replace('/onboarding');
    }
  }, [router, user?.legalAcceptedAt]);

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

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) {
      return;
    }

    setInput('');

    const now = new Date().toISOString();
    const tempUserId = crypto.randomUUID();
    const tempAssistantId = crypto.randomUUID();

    appendMessage({
      id: tempUserId,
      role: 'user',
      content: trimmed,
      createdAt: now,
    });

    appendMessage({
      id: tempAssistantId,
      role: 'assistant',
      content: '',
      createdAt: now,
      pending: true,
    });

    setIsStreaming(true);
    let assistantBuffer = '';
    let currentAssistantId = tempAssistantId;

    streamChatMessage(trimmed, {
      onAck: ({ userMessageId, createdAt }) => {
        updateMessage(tempUserId, {
          id: userMessageId,
          createdAt,
        });
      },
      onToken: (token) => {
        assistantBuffer += token;
        updateMessage(currentAssistantId, {
          content: assistantBuffer,
        });
      },
      onFinal: ({ assistantMessageId, createdAt, metadata }) => {
        currentAssistantId = assistantMessageId;
        updateMessage(tempAssistantId, {
          id: assistantMessageId,
          createdAt: createdAt ?? new Date().toISOString(),
          metadata: metadata ?? undefined,
          pending: false,
        });
      },
      onDone: () => {
        setIsStreaming(false);
      },
      onError: (error) => {
        console.error('Streaming error', error);
        updateMessage(currentAssistantId, {
          content: assistantBuffer
            ? `${assistantBuffer}\n\n_(Response truncated due to an error.)_`
            : 'I hit a snag while replying. Try sending that again?',
          pending: false,
        });
      },
    })
      .catch((error) => {
        console.error('Failed to stream message', error);
        updateMessage(tempAssistantId, {
          content: 'I had trouble responding. Try again in a moment.',
          pending: false,
        });
        setIsStreaming(false);
      })
      .finally(async () => {
        try {
          const latest = await fetchChatHistory();
          setMessages(latest.messages);
          setReport((prev) =>
            latest.report?.content
              ? parsePersonalInsightsReport(latest.report.content) ?? prev
              : prev,
          );
          if (latest.profile?.legal_acceptance_at) {
            updateUser({ legalAcceptedAt: latest.profile.legal_acceptance_at });
          }
        } catch (error) {
          console.warn('Failed to refresh chat history after streaming', error);
        }
      });
  }, [appendMessage, input, isStreaming, setMessages, updateMessage, updateUser]);

  const headerSubtitle = useMemo(() => {
    if (!user?.displayName) {
      return 'Coaching preview';
    }
    return `Chatting as ${user.displayName}`;
  }, [user?.displayName]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted">Loading your conversation…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-muted">{error}</p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:bg-surface-muted"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-6 md:h-[calc(100vh-200px)]">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">Chat with Fermi</h1>
        <p className="text-sm text-muted">{headerSubtitle}</p>
      </header>

      <YouReportCard report={report} />

      <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-surface sm:rounded-3xl">
        <div className="flex h-full flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {isStreaming ? <TypingIndicator /> : null}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSubmit} className="border-t border-border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message to Fermi..."
                rows={1}
                className="min-h-[48px] max-h-40 w-full flex-1 resize-none rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <button
                type="submit"
                disabled={isStreaming || input.trim().length === 0}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent text-accent-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 sm:w-12"
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

function ChatBubble({ message }: { message: ChatMessage & { pending?: boolean } }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm transition sm:max-w-[75%] md:max-w-[65%] ${
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
