import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'purpose-subscription-state-v1';
const TRIAL_DURATION_DAYS = 7;

type SubscriptionLifecycleStatus = 'trialing' | 'active' | 'expired';

type StoredSubscriptionState = {
  status: SubscriptionLifecycleStatus;
  trialEndsAt: string | null;
  updatedAt: string;
};

export type SubscriptionStatus = 'unknown' | SubscriptionLifecycleStatus;

export type SubscriptionStoreState = {
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  isLoading: boolean;
  error: string | null;
  hasAccess: boolean;
  initialize: () => Promise<void>;
  markActive: () => Promise<void>;
  reset: () => Promise<void>;
  refresh: () => Promise<void>;
};

const createTrialState = (): StoredSubscriptionState => {
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
  return {
    status: 'trialing',
    trialEndsAt: trialEndsAt.toISOString(),
    updatedAt: now.toISOString(),
  };
};

async function readStoredState(): Promise<StoredSubscriptionState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredSubscriptionState | null;
    if (!parsed) {
      return null;
    }
    if (!parsed.updatedAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function persistState(state: StoredSubscriptionState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function evaluateState(state: StoredSubscriptionState): StoredSubscriptionState {
  if (state.status === 'active') {
    return state;
  }
  if (!state.trialEndsAt) {
    return { ...state, status: 'expired', updatedAt: new Date().toISOString() };
  }
  const now = Date.now();
  const trialEnd = new Date(state.trialEndsAt).getTime();
  if (Number.isFinite(trialEnd) && trialEnd < now) {
    return { ...state, status: 'expired', updatedAt: new Date().toISOString() };
  }
  return state;
}

function toStoreState(state: StoredSubscriptionState | null): Pick<
  SubscriptionStoreState,
  'status' | 'trialEndsAt' | 'hasAccess'
> {
  if (!state) {
    return {
      status: 'unknown',
      trialEndsAt: null,
      hasAccess: true,
    };
  }

  return {
    status: state.status,
    trialEndsAt: state.trialEndsAt,
    hasAccess: state.status === 'active' || state.status === 'trialing',
  };
}

export const useSubscriptionStore = create<SubscriptionStoreState>()((set) => ({
  status: 'unknown',
  trialEndsAt: null,
  isLoading: false,
  error: null,
  hasAccess: true,
  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      let state = await readStoredState();
      if (!state) {
        state = createTrialState();
        await persistState(state);
      }
      const evaluated = evaluateState(state);
      if (evaluated.status !== state.status) {
        await persistState(evaluated);
      }
      set({ ...toStoreState(evaluated), isLoading: false });
    } catch (error) {
      console.error('Failed to initialize subscription state', error);
      set({ error: 'Unable to load subscription status.', isLoading: false, status: 'unknown', hasAccess: true });
    }
  },
  markActive: async () => {
    try {
      const existing = (await readStoredState()) ?? createTrialState();
      const updated: StoredSubscriptionState = {
        status: 'active',
        trialEndsAt: existing.trialEndsAt,
        updatedAt: new Date().toISOString(),
      };
      await persistState(updated);
      set({ ...toStoreState(updated), isLoading: false, error: null });
    } catch (error) {
      console.error('Failed to mark subscription active', error);
      set({ error: 'Unable to update subscription status.' });
    }
  },
  reset: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({
      status: 'unknown',
      trialEndsAt: null,
      isLoading: false,
      error: null,
      hasAccess: true,
    });
  },
  refresh: async () => {
    set({ isLoading: true, error: null });
    try {
      const state = await readStoredState();
      const evaluated = evaluateState(state ?? createTrialState());
      await persistState(evaluated);
      set({ ...toStoreState(evaluated), isLoading: false });
    } catch (error) {
      console.error('Failed to refresh subscription state', error);
      set({ error: 'Unable to refresh subscription status.', isLoading: false });
    }
  },
}));
