const STORAGE_KEY = 'purpose-analytics-buffer-v1';
const MAX_EVENTS = 200;

let memoryBuffer = [];
let cachedUserContext = null;

const isBrowser = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readFromStorage = () => {
  if (!isBrowser()) {
    return memoryBuffer;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeToStorage = (events) => {
  if (!isBrowser()) {
    memoryBuffer = events;
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    memoryBuffer = events;
  }
};

export const logEvent = (name, payload) => {
  const event = {
    name,
    payload,
    timestamp: new Date().toISOString(),
  };

  const events = [...readFromStorage(), event].slice(-MAX_EVENTS);
  writeToStorage(events);

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.info('[analytics]', event);
  }
};

export const getEvents = () => readFromStorage();

export const clearEvents = () => {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  memoryBuffer = [];
};

export const setAnalyticsUser = (id, properties) => {
  cachedUserContext = { id, properties };
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.info('[analytics:user]', cachedUserContext);
  }
};

export const getAnalyticsUser = () => cachedUserContext;
