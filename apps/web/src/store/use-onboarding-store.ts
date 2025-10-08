'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  OnboardingData,
  OnboardingStepId,
  OnboardingStoreState,
} from '@/features/onboarding/types';

const DEFAULT_DATA: OnboardingData = {
  demographics: {},
  fulfillment: {},
  personality: {},
  values: {
    firstRound: [],
    secondRound: [],
    finalRound: [],
  },
  reflections: {},
  constraint: undefined,
};

const INITIAL_STEP: OnboardingStepId = 'intro';

export const useOnboardingStore = create<OnboardingStoreState>()(
  persist(
    (set, get) => ({
      step: INITIAL_STEP,
      completedSteps: [],
      data: structuredClone(DEFAULT_DATA),
      setStep: (step) => set({ step }),
      markStepComplete: (step) => {
        const current = get().completedSteps;
        if (current.includes(step)) {
          return;
        }
        set({ completedSteps: [...current, step] });
      },
      updateData: (updater) =>
        set((state) => {
          const draft = structuredClone(state.data);
          updater(draft);
          return { data: draft };
        }),
      reset: () =>
        set({
          step: INITIAL_STEP,
          completedSteps: [],
          data: structuredClone(DEFAULT_DATA),
        }),
    }),
    {
      name: 'purpose-onboarding-store-v1',
      version: 1,
      migrate: (persisted) => {
        if (!persisted) {
          return {
            step: INITIAL_STEP,
            completedSteps: [],
            data: structuredClone(DEFAULT_DATA),
          } satisfies OnboardingStoreState;
        }
        return persisted as OnboardingStoreState;
      },
    },
  ),
);
