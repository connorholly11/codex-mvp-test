'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuestResponse, QuestStatus } from '@/features/quests/types';
import { QUESTS } from '@/features/quests/data/quests';

const DEFAULT_STATUSES: Record<string, QuestStatus> = Object.fromEntries(
  QUESTS.map((quest) => [quest.id, 'available']),
);

type QuestStoreState = {
  statuses: Record<string, QuestStatus>;
  responses: QuestResponse[];
  completeQuest: (questId: string, answer: QuestResponse['answer']) => void;
  reset: () => void;
};

export const useQuestsStore = create<QuestStoreState>()(
  persist(
    (set, get) => ({
      statuses: structuredClone(DEFAULT_STATUSES),
      responses: [],
      completeQuest: (questId, answer) => {
        const timestamp = new Date().toISOString();
        set({
          statuses: {
            ...get().statuses,
            [questId]: 'completed',
          },
          responses: [
            ...get().responses.filter((response) => response.questId !== questId),
            {
              questId,
              completedAt: timestamp,
              answer,
            },
          ],
        });
      },
      reset: () =>
        set({
          statuses: structuredClone(DEFAULT_STATUSES),
          responses: [],
        }),
    }),
    {
      name: 'purpose-quests-store-v1',
      version: 1,
    },
  ),
);
