export type AnalyticsEvent = {
  name: string;
  payload?: Record<string, unknown>;
  timestamp: string;
};

const STORAGE_KEY = 'purpose-analytics-buffer-v1';
const MAX_EVENTS = 200;

export function logEvent(name: string, payload?: Record<string, unknown>) {
  if (typeof window === 'undefined') {
    return;
  }
  const event: AnalyticsEvent = {
    name,
    payload,
    timestamp: new Date().toISOString(),
  };
  const events = getEvents();
  const next = [...events, event].slice(-MAX_EVENTS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  if (process.env.NODE_ENV !== 'production') {
    console.info('[analytics]', event);
  }
}

export function getEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as AnalyticsEvent[];
    }
    return [];
  } catch {
    return [];
  }
}

export function clearEvents() {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}
