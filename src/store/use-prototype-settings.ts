'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORE_KEY = 'purpose-prototype-settings-v1';

type PrototypeSettingsState = {
  hasConfirmedAge: boolean;
  confirmAge: () => void;
  reset: () => void;
};

export const usePrototypeSettings = create<PrototypeSettingsState>()(
  persist(
    (set) => ({
      hasConfirmedAge: false,
      confirmAge: () => set({ hasConfirmedAge: true }),
      reset: () => set({ hasConfirmedAge: false }),
    }),
    {
      name: STORE_KEY,
      version: 1,
    },
  ),
);
