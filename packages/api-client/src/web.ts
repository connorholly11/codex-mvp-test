import type { OnboardingPayload } from './onboarding';
import type { Json } from './types/supabase';
import type { QuestProgressResponse, QuestStatus } from './quests';
import { normalizeAssistantMetadata } from './chat-metadata';
import type { AssistantMessageMetadata } from './chat-metadata';

let apiBaseUrl: string | null = null;

export function setApiBaseUrl(url: string | null | undefined) {
  if (!url) {
    apiBaseUrl = null;
    return;
  }
  apiBaseUrl = url.replace(/\/?$/, '');
}

function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: AssistantMessageMetadata | null;
};

export type PersonalInsightsRecord = {
  report_type: string;
  title: string | null;
  content: unknown;
  generated_at: string;
  summary?: {
    topValueLabel: string | null;
    growthAreaLabel?: string | null;
    constraint: string | null;
  };
};

export type UserProfile = {
  display_name: string | null;
  legal_acceptance_at: string | null;
  onboarding_completed_at: string | null;
};

export type SubmitOnboardingResponse = {
  success: boolean;
  report: unknown;
  chatSessionId: string;
};

export type ChatHistoryResponse = {
  chatSessionId: string;
  messages: ChatMessage[];
  report: PersonalInsightsRecord | null;
  profile: UserProfile | null;
};

export type SendChatMessageResponse = {
  userMessage: {
    id: string;
    createdAt: string;
  };
  assistantMessage: {
    id: string;
    createdAt: string;
    content: string;
    metadata: AssistantMessageMetadata | null;
  };
};

export type NudgeStatus = 'pending' | 'scheduled' | 'sent' | 'dismissed';

export type Nudge = {
  id: string;
  kind: string;
  status: NudgeStatus;
  scheduledFor: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};


type StreamHandlers = {
  onToken: (token: string) => void;
  onAck?: (payload: { userMessageId: string; createdAt: string }) => void;
  onFinal?: (payload: {
    assistantMessageId: string;
    createdAt: string | null;
    metadata: AssistantMessageMetadata | null;
  }) => void;
  onDone: () => void;
  onError?: (error: Error) => void;
};

export type ChatStreamHandlers = StreamHandlers;

type RequestOptions = {
  accessToken?: string;
  signal?: AbortSignal;
};

function buildRequestInit(init: RequestInit | undefined, options?: RequestOptions): RequestInit {
  const headers = new Headers(init?.headers as HeadersInit | undefined);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options?.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`);
  }

  return {
    ...init,
    credentials: options?.accessToken ? 'omit' : 'include',
    headers,
    signal: options?.signal ?? init?.signal,
  } satisfies RequestInit;
}

async function assertOk(response: Response) {
  if (!response.ok) {
    const error = await safeParseJson(response);
    throw new Error(error?.error ?? `Request failed with status ${response.status}`);
  }
}

export async function submitOnboarding(
  payload: OnboardingPayload,
  options?: RequestOptions,
): Promise<SubmitOnboardingResponse> {
  const response = await fetch(
    resolveUrl('/api/onboarding'),
    buildRequestInit(
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      options,
    ),
  );

  await assertOk(response);
  return (await response.json()) as SubmitOnboardingResponse;
}

export async function fetchChatHistory(options?: RequestOptions): Promise<ChatHistoryResponse> {
  const response = await fetch(resolveUrl('/api/chat/history'), buildRequestInit(undefined, options));
  await assertOk(response);
  const payload = (await response.json()) as ChatHistoryResponse;
  return {
    ...payload,
    messages: (payload.messages ?? []).map((message) => ({
      ...message,
      metadata: normalizeAssistantMetadata(message.metadata ?? null),
    })),
  };
}

export async function sendChatMessage(
  message: string,
  options?: RequestOptions,
): Promise<SendChatMessageResponse> {
  const response = await fetch(
    resolveUrl('/api/chat/respond'),
    buildRequestInit(
      {
        method: 'POST',
        body: JSON.stringify({ message }),
      },
      options,
    ),
  );

  await assertOk(response);
  const payload = (await response.json()) as SendChatMessageResponse;
  return {
    ...payload,
    assistantMessage: {
      ...payload.assistantMessage,
      metadata: normalizeAssistantMetadata(payload.assistantMessage.metadata ?? null),
    },
  };
}

export async function fetchNudges(
  options?: RequestOptions & { statuses?: NudgeStatus[] },
): Promise<Nudge[]> {
  const url = new URL(resolveUrl('/api/nudges'), 'http://localhost');
  if (options?.statuses && options.statuses.length > 0) {
    url.searchParams.set('status', options.statuses.join(','));
  }

  const response = await fetch(url.toString(), buildRequestInit(undefined, options));
  await assertOk(response);
  const payload = (await response.json()) as { items: Array<Record<string, unknown>> };
  return (payload.items ?? []).map((item) => ({
    id: String(item.id ?? ''),
    kind: String(item.kind ?? ''),
    status: (item.status ?? 'pending') as NudgeStatus,
    scheduledFor: String(item.scheduled_for ?? item.scheduledFor ?? ''),
    payload: (item.payload as Record<string, unknown>) ?? {},
    createdAt: String(item.created_at ?? item.createdAt ?? ''),
    updatedAt: String(item.updated_at ?? item.updatedAt ?? ''),
  }));
}

export async function updateNudgeStatus(
  input: { id: string; status: NudgeStatus; context?: Record<string, unknown> },
  options?: RequestOptions,
): Promise<Nudge> {
  const response = await fetch(
    resolveUrl('/api/nudges'),
    buildRequestInit(
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      options,
    ),
  );

  await assertOk(response);
  const payload = (await response.json()) as { item: Record<string, unknown> };
  const item = payload.item ?? {};

  return {
    id: String(item.id ?? input.id),
    kind: String(item.kind ?? ''),
    status: (item.status ?? input.status) as NudgeStatus,
    scheduledFor: String(item.scheduled_for ?? item.scheduledFor ?? ''),
    payload: (item.payload as Record<string, unknown>) ?? {},
    createdAt: String(item.created_at ?? item.createdAt ?? new Date().toISOString()),
    updatedAt: String(item.updated_at ?? item.updatedAt ?? new Date().toISOString()),
  };
}

export async function streamChatMessage(
  message: string,
  handlers: StreamHandlers,
  options?: RequestOptions,
): Promise<void> {
  const response = await fetch(
    resolveUrl('/api/chat/stream'),
    buildRequestInit(
      {
        method: 'POST',
        body: JSON.stringify({ message }),
      },
      options,
    ),
  );

  await assertOk(response);

  if (!response.body) {
    throw new Error('Streaming response body is not available');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let doneCalled = false;

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const raw of events) {
        const { event, data } = parseEventChunk(raw);
        if (event === 'heartbeat') {
          continue;
        }

        if (event === 'ack') {
          if (handlers.onAck && data) {
            try {
              const payload = JSON.parse(data);
              if (payload?.userMessageId && payload?.createdAt) {
                handlers.onAck({
                  userMessageId: payload.userMessageId,
                  createdAt: payload.createdAt,
                });
              }
            } catch (error) {
              console.warn('Failed to parse ack payload', error);
            }
          }
          continue;
        }

        if (event === 'token') {
          try {
            const payload = JSON.parse(data ?? '{}');
            if (typeof payload.token === 'string') {
              handlers.onToken(payload.token);
            }
          } catch (error) {
            console.warn('Failed to parse token payload', error);
          }
          continue;
        }

        if (event === 'final') {
          if (handlers.onFinal && data) {
            try {
              const payload = JSON.parse(data);
              if (payload?.assistantMessageId) {
                handlers.onFinal({
                  assistantMessageId: payload.assistantMessageId,
                  createdAt: payload.createdAt ?? null,
                  metadata: normalizeAssistantMetadata(payload.metadata ?? null),
                });
              }
            } catch (error) {
              console.warn('Failed to parse final payload', error);
            }
          }
          continue;
        }

        if (event === 'done') {
          doneCalled = true;
          handlers.onDone();
          continue;
        }

        if (event === 'error') {
          try {
            const payload = JSON.parse(data ?? '{}');
            handlers.onError?.(new Error(payload.message ?? 'Streaming error'));
          } catch (error) {
            handlers.onError?.(error instanceof Error ? error : new Error('Streaming error'));
          }
          continue;
        }
      }
    }
  } catch (error) {
    handlers.onError?.(error instanceof Error ? error : new Error('Streaming interrupted'));
    throw error;
  } finally {
    if (!doneCalled) {
      handlers.onDone();
    }

    await reader.cancel().catch(() => {
      /* noop */
    });
  }
}

export async function fetchQuestProgress(options?: RequestOptions): Promise<QuestProgressResponse> {
  const response = await fetch(resolveUrl('/api/quests'), buildRequestInit(undefined, options));
  await assertOk(response);
  return (await response.json()) as QuestProgressResponse;
}

export async function completeQuest(
  questId: string,
  answer: Json | null,
  options?: RequestOptions,
): Promise<QuestProgressResponse> {
  const response = await fetch(
    resolveUrl(`/api/quests/${questId}/complete`),
    buildRequestInit(
      {
        method: 'POST',
        body: JSON.stringify({ answer }),
      },
      options,
    ),
  );

  await assertOk(response);
  return (await response.json()) as QuestProgressResponse;
}

async function safeParseJson(response: Response): Promise<any | null> {
  try {
    return await response.clone().json();
  } catch (_error) {
    return null;
  }
}

function parseEventChunk(chunk: string): { event: string; data: string | null } {
  const lines = chunk.split('\n');
  let event = 'message';
  let data: string | null = null;

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    }

    if (line.startsWith('data:')) {
      const payload = line.slice(5).trim();
      data = data ? `${data}\n${payload}` : payload;
    }
  }

  return { event, data };
}
