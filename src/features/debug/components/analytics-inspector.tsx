'use client';

import { useEffect, useState } from 'react';
import { getEvents, clearEvents } from '@/lib/analytics';

export function AnalyticsInspector() {
  const [events, setEvents] = useState(() => []);

  const refresh = () => {
    setEvents(getEvents());
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Analytics inspector</h1>
        <p className="text-sm text-muted">
          Events are buffered locally for this prototype. Use this panel to confirm which
          actions are being tracked before wiring an external sink.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refresh}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              clearEvents();
              refresh();
            }}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Clear buffer
          </button>
        </div>
      </header>
      <section className="rounded-3xl border border-border bg-surface p-6">
        {events.length === 0 ? (
          <p className="text-sm text-muted">No events captured yet.</p>
        ) : (
          <ul className="flex flex-col gap-3 text-xs text-muted">
            {events
              .slice()
              .reverse()
              .map((event, index) => (
                <li
                  key={`${event.timestamp}-${event.name}-${index}`}
                  className="rounded-2xl border border-border bg-surface-muted px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{event.name}</span>
                    <span>{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                  {event.payload ? (
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-black/20 p-3 text-[11px] text-muted">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  ) : null}
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
