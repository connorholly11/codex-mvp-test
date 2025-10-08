'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PrototypeUser = {
  id: string;
  name: string;
  email: string;
  legalAcceptedAt?: string;
};

type SessionState = {
  user: PrototypeUser | null;
  setUser: (user: PrototypeUser) => void;
  updateUser: (patch: Partial<PrototypeUser>) => void;
  clearUser: () => void;
};

const STORE_KEY = 'purpose-session-v1';

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      updateUser: (patch) =>
        set((state) => {
          if (!state.user) {
            return state;
          }
          return { user: { ...state.user, ...patch } };
        }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: STORE_KEY,
      version: 1,
    },
  ),
);
