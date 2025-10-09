'use client';

import { create } from 'zustand';
import type { QuestResponse, QuestStatus } from '@/features/quests/types';
import { QUESTS } from '@/features/quests/data/quests';

const DEFAULT_STATUSES: Record<string, QuestStatus> = Object.fromEntries(
  QUESTS.map((quest) => [quest.id, 'available']),
);

type QuestStoreState = {
  statuses: Record<string, QuestStatus>;
  responses: QuestResponse[];
  isLoading: boolean;
  error: string | null;
  initialize: (accessToken?: string) => Promise<void>;
  completeQuest: (questId: string, answer: QuestResponse['answer'], accessToken?: string) => Promise<void>;
  reset: () => void;
};

type QuestsResponsePayload = {
  statuses: Record<string, QuestStatus>;
  responses: QuestResponse[];
};

export const useQuestsStore = create<QuestStoreState>((set, get) => ({
  statuses: structuredClone(DEFAULT_STATUSES),
  responses: [],
  isLoading: false,
  error: null,
  initialize: async (accessToken) => {
    if (get().isLoading) {
      return;
    }

    set(() => ({ isLoading: true, error: null }) as Partial<QuestStoreState>);
    try {
      const response = await fetch('/api/quests', buildRequestInit(accessToken));
      if (!response.ok) {
        throw new Error('Failed to fetch quests');
      }
      const data = (await response.json()) as QuestsResponsePayload;
      set(() => ({
        statuses: { ...DEFAULT_STATUSES, ...data.statuses },
        responses: data.responses,
        isLoading: false,
      }) as Partial<QuestStoreState>);
    } catch (error) {
      console.error('Failed to load quests', error);
      set(() => ({
        error: 'Unable to load quests right now.',
        isLoading: false,
      }) as Partial<QuestStoreState>);
    }
  },
  completeQuest: async (questId, answer, accessToken) => {
    const response = await fetch(`/api/quests/${questId}/complete`, {
      ...buildRequestInit(accessToken),
      method: 'POST',
      body: JSON.stringify({ answer }),
    });

    if (!response.ok) {
      const errorPayload = (await safeParseJson(response)) as { error?: string } | null;
      throw new Error(errorPayload?.error ?? 'Failed to complete quest');
    }

    const payload = (await response.json()) as QuestsResponsePayload;
    set(() => ({
      statuses: { ...DEFAULT_STATUSES, ...payload.statuses },
      responses: payload.responses,
    }) as Partial<QuestStoreState>);
  },
  reset: () =>
    set(() => ({
      statuses: structuredClone(DEFAULT_STATUSES),
      responses: [],
      isLoading: false,
      error: null,
    }) as Partial<QuestStoreState>),
}));

function buildRequestInit(accessToken?: string): RequestInit {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return {
    headers,
    credentials: accessToken ? 'omit' : 'include',
  } satisfies RequestInit;
}

async function safeParseJson(response: Response): Promise<unknown | null> {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}
