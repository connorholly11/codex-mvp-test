import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuthenticatedSupabase } from '@/lib/auth/get-authenticated-client';

vi.mock('@/lib/auth/get-authenticated-client', () => ({
  getAuthenticatedSupabase: vi.fn(),
}));

const anthropicMessageCreate = vi.fn();
const anthropicConstructor = vi.fn().mockImplementation(() => ({
  messages: {
    create: anthropicMessageCreate,
  },
}));

vi.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: anthropicConstructor,
}));

const originalFetch = globalThis.fetch;
const fetchMock = vi.fn();

const getAuthenticatedSupabaseMock = getAuthenticatedSupabase as unknown as vi.Mock;

type SupabaseMock = ReturnType<typeof createSupabaseMock>;
type ChatRespondHandler = (request: Request) => Promise<Response>;
let chatRespondPost: ChatRespondHandler;

function createJsonRequest(body: unknown) {
  return new Request('http://localhost/api/chat/respond', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Parameters<ChatRespondHandler>[0];
}

class SessionSelectBuilder {
  constructor(private result: { data: { id: string } | null; error: unknown }) {}
  eq() {
    return this;
  }
  order() {
    return this;
  }
  limit() {
    return this;
  }
  async maybeSingle() {
    return this.result;
  }
}

class ReportSelectBuilder {
  constructor(private result: { data: { content: unknown } | null; error: unknown }) {}
  eq() {
    return this;
  }
  async maybeSingle() {
    return this.result;
  }
}

class HistorySelectBuilder {
  constructor(private result: { data: unknown; error: unknown }) {}
  eq() {
    return this;
  }
  order() {
    return this;
  }
  limit() {
    return this.result;
  }
}

function createSupabaseMock() {
  const chatSessionsSelect = vi.fn(() => new SessionSelectBuilder({ data: { id: 'session-001' }, error: null }));

  const reportSelect = vi.fn(() => new ReportSelectBuilder({
    data: { content: { openingInsight: 'Insight', sections: [] } },
    error: null,
  }));

  const historySelect = vi.fn(() =>
    new HistorySelectBuilder({
      data: [
        { role: 'user', content: 'Hello Fermi' },
        { role: 'assistant', content: 'Welcome back.' },
      ],
      error: null,
    }),
  );

  const chatMessagesInsert = vi
    .fn()
    .mockReturnValueOnce({
      select: () => ({
        single: async () => ({
          data: { id: 'user-msg-1', created_at: '2024-01-01T00:00:00Z' },
          error: null,
        }),
      }),
    })
    .mockReturnValueOnce({
      select: () => ({
        single: async () => ({
          data: {
            id: 'assistant-msg-1',
            created_at: '2024-01-01T00:00:01Z',
            content: 'Assistant reply',
            metadata: { model: 'claude' },
          },
          error: null,
        }),
      }),
    });

  const chatSessionsUpdate = vi.fn(() => ({
    eq: async () => ({ error: null }),
  }));

  const supabase = {
    from: vi.fn((table: string) => {
      switch (table) {
        case 'chat_sessions':
          return { select: chatSessionsSelect, update: chatSessionsUpdate };
        case 'chat_messages':
          return { insert: chatMessagesInsert, select: historySelect };
        case 'reports':
          return { select: reportSelect };
        default:
          throw new Error(`Unhandled table: ${table}`);
      }
    }),
  };

  return {
    supabase,
    spies: {
      chatSessionsSelect,
      chatMessagesInsert,
      reportSelect,
      historySelect,
      chatSessionsUpdate,
    },
    chatMessagesInsert,
  };
}

describe('POST /api/chat/respond', () => {
  beforeAll(async () => {
    ({ POST: chatRespondPost } = await import('@/app/api/chat/respond/route'));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    anthropicMessageCreate.mockReset();
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.ANTHROPIC_MODEL_NAME = 'claude-test';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns 401 when unauthenticated', async () => {
    getAuthenticatedSupabaseMock.mockResolvedValueOnce(null);

    const request = createJsonRequest({ message: 'Hello' });

    const response = await chatRespondPost(request);
    expect(response.status).toBe(401);
  });

  it('validates message payloads', async () => {
    const { supabase } = createSupabaseMock();
    getAuthenticatedSupabaseMock.mockResolvedValueOnce({
      client: supabase,
      user: { id: 'user-123', email: 'user@example.com', user_metadata: {} },
    });

    const request = createJsonRequest({ message: '' });

    const response = await chatRespondPost(request);
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe('Invalid request');
  });

  it('persists the user message and surfaces Anthropic failures', async () => {
    const { supabase, chatMessagesInsert } = createSupabaseMock();
    getAuthenticatedSupabaseMock.mockResolvedValueOnce({
      client: supabase,
      user: { id: 'user-123', email: 'user@example.com', user_metadata: {} },
    });

    const request = createJsonRequest({ message: 'Hello there' });

    const response = await chatRespondPost(request);

    expect(chatMessagesInsert).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Failed to generate response');
  });
});
