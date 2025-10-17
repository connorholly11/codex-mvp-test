import { create } from 'zustand';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type SessionState = {
  status: SessionStatus;
  accessToken: string | null;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  legalAcceptedAt: string | null;
  onboardingCompletedAt: string | null;
  setSession: (options: {
    accessToken: string;
    userId: string;
    email: string | null;
    displayName: string | null;
  }) => void;
  setProfile: (profile: {
    displayName?: string | null;
    legalAcceptedAt?: string | null;
    onboardingCompletedAt?: string | null;
  }) => void;
  setStatus: (status: SessionStatus) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()((set) => ({
  status: 'loading',
  accessToken: null,
  userId: null,
  email: null,
  displayName: null,
  legalAcceptedAt: null,
  onboardingCompletedAt: null,
  setSession: ({ accessToken, userId, email, displayName }) =>
    set({
      status: 'authenticated',
      accessToken,
      userId,
      email,
      displayName,
    }),
  setProfile: ({ displayName, legalAcceptedAt, onboardingCompletedAt }) =>
    set((state) => ({
      displayName: displayName ?? state.displayName,
      legalAcceptedAt: legalAcceptedAt ?? state.legalAcceptedAt,
      onboardingCompletedAt: onboardingCompletedAt ?? state.onboardingCompletedAt,
    })),
  setStatus: (status) => set({ status }),
  clearSession: () =>
    set({
      status: 'unauthenticated',
      accessToken: null,
      userId: null,
      email: null,
      displayName: null,
      legalAcceptedAt: null,
      onboardingCompletedAt: null,
    }),
}));
