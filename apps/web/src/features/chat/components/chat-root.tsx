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
import {
  fetchChatHistory,
  streamChatMessage,
  type AssistantToolCall,
  type ChatMessage,
  type GetLocationToolCall,
  type ScheduleReminderToolCall,
  type StartTimerToolCall,
  type SaveNoteToolCall,
  type CreateIcsEventToolCall,
} from '@purpose/api-client';
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
        ]);

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
          metadata: metadata ?? null,
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
  const toolCall = !isUser ? message.metadata?.tool_call ?? null : null;

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
        {!isUser && toolCall ? <ToolCallSummary tool={toolCall} /> : null}
      </div>
    </div>
  );
}

function ToolCallSummary({ tool }: { tool: AssistantToolCall }) {
  if (!tool) {
    return null;
  }

  if (tool.validation.valid === false) {
    const issue = tool.validation.issues?.[0] ?? 'validation failed';
    return (
      <div className="mt-3 rounded-xl border border-border/70 bg-surface px-3 py-2 text-xs text-muted">
        <p className="font-medium text-foreground">Suggested tool unavailable</p>
        <p className="mt-1 leading-snug">
          Fermi proposed a follow-up action, but the request could not be used ({issue}).
        </p>
      </div>
    );
  }

  if (isScheduleReminderTool(tool)) {
    const scheduledDate = parseIso(tool.args.iso_datetime);
    const scheduledLabel = scheduledDate ? formatDisplayDate(scheduledDate) : 'the requested time';
    const status = tool.result?.status ?? null;
    const statusLabel = status === 'confirmed' ? 'Confirmed' : status === 'dismissed' ? 'Dismissed' : null;

    return (
      <div className="mt-3 space-y-1 rounded-xl border border-border/70 bg-surface px-3 py-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground">Reminder proposal</span>
          {statusLabel ? (
            <span
              className={`text-[11px] font-semibold uppercase tracking-wide ${
                status === 'confirmed' ? 'text-accent' : 'text-muted'
              }`}
            >
              {statusLabel}
            </span>
          ) : null}
        </div>
        <p className="text-foreground">Schedule a notification for {scheduledLabel}.</p>
        <p className="text-muted">Title: {tool.args.title}</p>
        <p className="text-muted">Message: {tool.args.body}</p>
      </div>
    );
  }

  if (isGetLocationTool(tool)) {
    const status = tool.result?.status ?? null;
    const statusLabel = status === 'confirmed' ? 'Shared' : status === 'dismissed' ? 'Declined' : null;
    const context = (tool.result?.context as { location?: { city?: string | null; region?: string | null; country?: string | null } } | undefined)?.location;
    const locationLabel = context
      ? [context.city, context.region, context.country].filter(Boolean).join(', ')
      : null;

    return (
      <div className="mt-3 space-y-1 rounded-xl border border-border/70 bg-surface px-3 py-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground">Location context</span>
          {statusLabel ? (
            <span
              className={`text-[11px] font-semibold uppercase tracking-wide ${
                status === 'confirmed' ? 'text-accent' : 'text-muted'
              }`}
            >
              {statusLabel}
            </span>
          ) : null}
        </div>
        <p className="text-foreground">Fermi asked for city-level location.</p>
        <p className="text-muted">
          {locationLabel ? `Shared as ${locationLabel}.` : 'Waiting for mobile confirmation.'}
        </p>
      </div>
    );
  }

  if (isStartTimerTool(tool)) {
    const status = tool.result?.status ?? null;
    const statusLabel = status === 'confirmed' ? 'Started' : status === 'dismissed' ? 'Skipped' : null;
    const durationLabel = formatDuration(tool.args.duration_seconds);
    const context = (tool.result?.context as { timer?: { fireDate?: string; label?: string | null } } | undefined)?.timer;
    const fireDateParsed = context?.fireDate ? parseIso(context.fireDate) : null;
    const fireDateLabel = fireDateParsed ? formatDisplayDate(fireDateParsed) : null;

    return (
      <div className="mt-3 space-y-1 rounded-xl border border-border/70 bg-surface px-3 py-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground">Timer suggestion</span>
          {statusLabel ? (
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${status === 'confirmed' ? 'text-accent' : 'text-muted'}`}>
              {statusLabel}
            </span>
          ) : null}
        </div>
        <p className="text-foreground">Start a {durationLabel} timer.</p>
        {tool.args.label ? <p className="text-muted">Label: {tool.args.label}</p> : null}
        {fireDateLabel ? <p className="text-muted">Scheduled to end {fireDateLabel}.</p> : null}
      </div>
    );
  }

  if (isSaveNoteTool(tool)) {
    const status = tool.result?.status ?? null;
    const statusLabel = status === 'confirmed' ? 'Saved' : status === 'dismissed' ? 'Skipped' : null;
    const preview = truncate(tool.args.body, 120);
    const context = (tool.result?.context as { note?: { title?: string | null } } | undefined)?.note;

    return (
      <div className="mt-3 space-y-1 rounded-xl border border-border/70 bg-surface px-3 py-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground">Note capture</span>
          {statusLabel ? (
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${status === 'confirmed' ? 'text-accent' : 'text-muted'}`}>
              {statusLabel}
            </span>
          ) : null}
        </div>
        <p className="text-foreground">Store a private note for later reflection.</p>
        {tool.args.title ? <p className="text-muted">Title: {tool.args.title}</p> : null}
        <p className="text-muted">Preview: {preview}</p>
        {context?.title ? <p className="text-muted">Saved as: {context.title}</p> : null}
      </div>
    );
  }

  if (isCreateIcsEventTool(tool)) {
    const status = tool.result?.status ?? null;
    const statusLabel = status === 'confirmed' ? 'Created' : status === 'dismissed' ? 'Skipped' : null;
    const eventWindow = formatEventWindow(tool.args.start_iso, tool.args.duration_minutes);
    const context = (tool.result?.context as { event?: { shared?: boolean } } | undefined)?.event;

    return (
      <div className="mt-3 space-y-1 rounded-xl border border-border/70 bg-surface px-3 py-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground">Calendar file</span>
          {statusLabel ? (
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${status === 'confirmed' ? 'text-accent' : 'text-muted'}`}>
              {statusLabel}
            </span>
          ) : null}
        </div>
        <p className="text-foreground">Generate an .ics event for manual calendar import.</p>
        <p className="text-muted">Event: {eventWindow}</p>
        <p className="text-muted">Shared immediately: {context?.shared ? 'Yes' : 'No'}</p>
      </div>
    );
  }

  return null;
}

function isScheduleReminderTool(tool: AssistantToolCall): tool is ScheduleReminderToolCall {
  return tool.name === 'schedule_reminder' && tool.validation.valid === true;
}

function isGetLocationTool(tool: AssistantToolCall): tool is GetLocationToolCall {
  return tool.name === 'get_location' && tool.validation.valid === true;
}

function isStartTimerTool(tool: AssistantToolCall): tool is StartTimerToolCall {
  return tool.name === 'start_timer' && tool.validation.valid === true;
}

function isSaveNoteTool(tool: AssistantToolCall): tool is SaveNoteToolCall {
  return tool.name === 'save_note' && tool.validation.valid === true;
}

function isCreateIcsEventTool(tool: AssistantToolCall): tool is CreateIcsEventToolCall {
  return tool.name === 'create_ics_event' && tool.validation.valid === true;
}

function parseIso(value: string): Date | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function formatDisplayDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.warn('Failed to format reminder time', error);
    return date.toLocaleString();
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
  }
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (remaining === 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  return `${minutes} minute${minutes === 1 ? '' : 's'} ${remaining} second${remaining === 1 ? '' : 's'}`;
}

function truncate(value: string, length: number): string {
  if (value.length <= length) {
    return value;
  }
  return `${value.slice(0, length - 3)}...`;
}

function formatEventWindow(startIso: string, durationMinutes: number): string {
  const start = parseIso(startIso);
  if (!start) {
    return `${startIso} (${durationMinutes} min)`;
  }
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const startLabel = formatter.format(start);
  const endLabel = formatter.format(end);
  if (startLabel === endLabel) {
    return `${startLabel} (${durationMinutes} min)`;
  }
  return `${startLabel} -> ${endLabel}`;
}
