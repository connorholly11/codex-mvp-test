import { create } from 'zustand';
import {
  QUESTS,
  completeQuest as completeQuestRequest,
  fetchQuestProgress,
  type QuestProgressResponse,
  type QuestResponse,
  type QuestStatus,
} from '@purpose/api-client';

const buildDefaultStatuses = (): Record<string, QuestStatus> =>
  QUESTS.reduce<Record<string, QuestStatus>>((acc, quest) => {
    acc[quest.id] = 'available';
    return acc;
  }, {});

type QuestStoreState = {
  statuses: Record<string, QuestStatus>;
  responses: QuestResponse[];
  isLoading: boolean;
  error: string | null;
  initialize: (accessToken?: string) => Promise<void>;
  completeQuest: (questId: string, answer: QuestResponse['answer'], accessToken?: string) => Promise<void>;
  reset: () => void;
};

export const useQuestsStore = create<QuestStoreState>()((set, get) => ({
  statuses: buildDefaultStatuses(),
  responses: [],
  isLoading: false,
  error: null,
  initialize: async (accessToken) => {
    if (get().isLoading) {
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const payload = await fetchQuestProgress({ accessToken });
      set((state) => applyQuestPayload(state, payload));
    } catch (error) {
      console.error('Failed to load quests', error);
      set({ error: 'Unable to load quests right now.', isLoading: false });
    }
  },
  completeQuest: async (questId, answer, accessToken) => {
    const response = await completeQuestRequest(questId, answer ?? null, { accessToken });
    set((state) => applyQuestPayload(state, response));
  },
  reset: () =>
    set({
      statuses: buildDefaultStatuses(),
      responses: [],
      isLoading: false,
      error: null,
    }),
}));

function applyQuestPayload(
  state: QuestStoreState,
  payload: QuestProgressResponse,
): Partial<QuestStoreState> & Pick<QuestStoreState, 'statuses' | 'responses'> {
  return {
    statuses: { ...buildDefaultStatuses(), ...payload.statuses },
    responses: payload.responses,
    isLoading: false,
    error: null,
  };
}
