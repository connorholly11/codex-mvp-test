import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { onboardingPayloadSchema } from '@purpose/api-client/onboarding';
import type { OnboardingPayload } from '@purpose/api-client/onboarding';
import { getAuthenticatedSupabase } from '@/lib/auth/get-authenticated-client';

vi.mock('@/lib/auth/get-authenticated-client', () => ({
  getAuthenticatedSupabase: vi.fn(),
}));

function createOnboardingPayload(): OnboardingPayload {
  return {
    onboarding: {
      demographics: { age: 32, gender: 'female', occupation: 'Operator' },
      fulfillment: { health: 3, work: 4, confidence: 2, relationships: 5, social: 4 },
      constraint: 'Saying yes to everything and burning out.',
      personality: { 'bfi-1': 4, 'bfi-2': 3, 'bfi-3': 5 },
      values: {
        firstRound: ['own-time', 'new-experiences', 'fun-pleasure', 'achieve-success', 'have-control'],
        secondRound: ['own-time', 'new-experiences', 'have-control', 'feel-safe', 'be-liked'],
        finalRound: ['own-time', 'feel-safe', 'have-control'],
      },
      reflections: {
        desire: 'Find room to pursue the creative projects I keep postponing.',
        avoidance: 'Admitting I am the bottleneck for my team.',
      },
    },
    profile: {
      displayName: 'Purpose Tester',
      legalAcceptedAt: new Date().toISOString(),
    },
  };
}

type SupabaseMock = ReturnType<typeof createSupabaseMock>;
type OnboardingHandler = typeof import('@/app/api/onboarding/route').POST;

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

function createSupabaseMock() {
  const profilesUpsert = vi.fn(() => ({
    select: () => ({
      single: async () => ({ data: { user_id: 'user-123' }, error: null }),
    }),
  }));

  const assessmentsInsert = vi.fn(async () => ({ error: null }));

  const reportsUpsert = vi.fn(() => ({
    select: () => ({
      single: async () => ({ data: { id: 'report-123' }, error: null }),
    }),
  }));

  const chatSessionsSelect = vi.fn(() => new SessionSelectBuilder({ data: { id: 'session-001' }, error: null }));

  const chatMessagesSelect = vi.fn(() => ({
    eq: async () => ({ count: 1, error: null }),
  }));

  const supabase = {
    from: vi.fn((table: string) => {
      switch (table) {
        case 'profiles':
          return { upsert: profilesUpsert };
        case 'assessments':
          return { insert: assessmentsInsert };
        case 'reports':
          return { upsert: reportsUpsert };
        case 'chat_sessions':
          return { select: chatSessionsSelect };
        case 'chat_messages':
          return { select: chatMessagesSelect };
        default:
          throw new Error(`Unhandled table: ${table}`);
      }
    }),
  };

  return {
    supabase,
    spies: {
      profilesUpsert,
      assessmentsInsert,
      reportsUpsert,
      chatSessionsSelect,
      chatMessagesSelect,
    },
  };
}

type OnboardingHandler = typeof import('@/app/api/onboarding/route').POST;
let onboardingPost: OnboardingHandler;

const getAuthenticatedSupabaseMock = getAuthenticatedSupabase as unknown as vi.Mock;

function createJsonRequest(body: unknown) {
  return new Request('http://localhost/api/onboarding', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Parameters<OnboardingHandler>[0];
}

describe('POST /api/onboarding', () => {
  beforeAll(async () => {
    ({ POST: onboardingPost } = await import('@/app/api/onboarding/route'));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when the user is not authenticated', async () => {
    getAuthenticatedSupabaseMock.mockResolvedValueOnce(null);

    const request = createJsonRequest(createOnboardingPayload());

    const response = await onboardingPost(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  it('validates payloads using the shared schema', async () => {
    const { supabase } = createSupabaseMock();
    getAuthenticatedSupabaseMock.mockResolvedValueOnce({
      client: supabase,
      user: { id: 'user-123', email: 'user@example.com', user_metadata: {} },
    });

    const invalidPayload = { foo: 'bar' };
    expect(() => onboardingPayloadSchema.parse(invalidPayload)).toThrow();

    const request = createJsonRequest(invalidPayload);

    const response = await onboardingPost(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid payload');
  });

  it('persists onboarding data and returns the generated report', async () => {
    const { supabase, spies } = createSupabaseMock();
    getAuthenticatedSupabaseMock.mockResolvedValueOnce({
      client: supabase,
      user: {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: { full_name: 'Purpose Tester' },
      },
    });

    const payload = createOnboardingPayload();

    const request = createJsonRequest(payload);

    const response = await onboardingPost(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.chatSessionId).toBe('session-001');
    expect(body.report).toMatchObject({ title: 'Your Personal Insights' });

    expect(spies.profilesUpsert).toHaveBeenCalled();
    expect(spies.assessmentsInsert).toHaveBeenCalled();
    expect(spies.reportsUpsert).toHaveBeenCalled();
    expect(spies.chatSessionsSelect).toHaveBeenCalled();
    expect(spies.chatMessagesSelect).toHaveBeenCalled();
  });
});
