'use client';

import { create } from 'zustand';

export type SessionUser = {
  id: string;
  email: string;
  displayName: string | null;
  legalAcceptedAt: string | null;
};

type SessionState = {
  user: SessionUser | null;
  setUser: (user: SessionUser) => void;
  updateUser: (patch: Partial<SessionUser>) => void;
  clearUser: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
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
}));
