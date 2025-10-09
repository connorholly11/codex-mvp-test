import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  setApiBaseUrl,
  submitOnboarding,
  streamChatMessage,
} from '@purpose/api-client/web';
import type { OnboardingPayload } from '@purpose/api-client/onboarding';

const encoder = new TextEncoder();

const onboardingPayload: OnboardingPayload = {
  onboarding: {
    demographics: {
      age: 30,
      gender: 'female',
      occupation: 'Product Manager',
    },
    fulfillment: {
      health: 3,
      work: 4,
      confidence: 2,
      relationships: 5,
      social: 4,
    },
    constraint: 'Feeling stretched thin when deadlines overlap.',
    personality: {
      'bfi-1': 4,
      'bfi-2': 3,
      'bfi-3': 5,
    },
    values: {
      firstRound: ['own-time', 'new-experiences', 'fun-pleasure', 'achieve-success', 'have-control'],
      secondRound: ['own-time', 'new-experiences', 'have-control', 'feel-safe', 'be-liked'],
      finalRound: ['own-time', 'have-control', 'feel-safe'],
    },
    reflections: {
      desire: 'Launch a healthier creative rhythm.',
      avoidance: 'Admitting I need help delegating.',
    },
  },
  profile: {
    displayName: 'Jordan Purpose',
    legalAcceptedAt: new Date().toISOString(),
  },
};

function buildStreamResponse(chunks: string[]): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
    status: 200,
  });
}

const noopJsonResponse = (data: unknown) =>
  new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });

describe('api client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    setApiBaseUrl(null);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('honours the configured API base URL when submitting onboarding', async () => {
    const fetchMock = vi.fn(async () =>
      noopJsonResponse({ success: true, report: null, chatSessionId: 'session-1' }),
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    setApiBaseUrl('https://api.example.com/');
    await submitOnboarding(onboardingPayload);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/api/onboarding');
  });

  it('streams chat events and forwards handlers in order', async () => {
    const events = [
      'event: ack\ndata: {"userMessageId":"user-1","createdAt":"2024-01-01T00:00:00Z"}\n\n',
      'event: token\ndata: {"token":"Hello"}\n\n',
      'event: final\ndata: {"assistantMessageId":"assistant-1","createdAt":"2024-01-01T00:00:01Z"}\n\n',
      'event: done\ndata: {}\n\n',
    ];

    globalThis.fetch = vi.fn(async () => buildStreamResponse(events)) as unknown as typeof fetch;

    const tokens: string[] = [];
    const ackPayloads: unknown[] = [];
    const finalPayloads: unknown[] = [];
    let doneCount = 0;

    await streamChatMessage('Hello there', {
      onAck: (payload) => ackPayloads.push(payload),
      onToken: (token) => tokens.push(token),
      onFinal: (payload) => finalPayloads.push(payload),
      onDone: () => {
        doneCount += 1;
      },
      onError: (error) => {
        throw error;
      },
    });

    expect(ackPayloads).toEqual([
      { userMessageId: 'user-1', createdAt: '2024-01-01T00:00:00Z' },
    ]);
    expect(tokens).toEqual(['Hello']);
    expect(finalPayloads).toEqual([
      {
        assistantMessageId: 'assistant-1',
        createdAt: '2024-01-01T00:00:01Z',
        metadata: null,
      },
    ]);
    expect(doneCount).toBe(1);
  });

  it('invokes onDone even if the stream closes without a done event', async () => {
    const events = ['event: token\ndata: {"token":"Hi"}\n\n'];
    globalThis.fetch = vi.fn(async () => buildStreamResponse(events)) as unknown as typeof fetch;

    let doneCount = 0;
    await streamChatMessage('Short message', {
      onToken: () => {
        /* noop */
      },
      onDone: () => {
        doneCount += 1;
      },
    });

    expect(doneCount).toBe(1);
  });
});
