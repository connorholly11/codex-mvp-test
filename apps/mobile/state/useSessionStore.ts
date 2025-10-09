import { create } from 'zustand';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type SessionState = {
  status: SessionStatus;
  accessToken: string | null;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  setSession: (options: {
    accessToken: string;
    userId: string;
    email: string | null;
    displayName: string | null;
  }) => void;
  setDisplayName: (displayName: string | null) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()((set) => ({
  status: 'loading',
  accessToken: null,
  userId: null,
  email: null,
  displayName: null,
  setSession: ({ accessToken, userId, email, displayName }) =>
    set({
      status: 'authenticated',
      accessToken,
      userId,
      email,
      displayName,
    }),
  setDisplayName: (displayName) => set({ displayName }),
  clearSession: () =>
    set({
      status: 'unauthenticated',
      accessToken: null,
      userId: null,
      email: null,
      displayName: null,
    }),
}));
