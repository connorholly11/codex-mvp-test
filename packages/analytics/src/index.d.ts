export type AnalyticsEvent = {
  name: string;
  payload?: Record<string, unknown>;
  timestamp: string;
};

export type AnalyticsUserContext = {
  id: string | null;
  properties?: Record<string, unknown>;
};

export declare const logEvent: (name: string, payload?: Record<string, unknown>) => void;
export declare const getEvents: () => AnalyticsEvent[];
export declare const clearEvents: () => void;
export declare const setAnalyticsUser: (id: string | null, properties?: Record<string, unknown>) => void;
export declare const getAnalyticsUser: () => AnalyticsUserContext | null;
