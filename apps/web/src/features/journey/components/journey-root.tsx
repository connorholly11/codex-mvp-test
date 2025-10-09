'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchChatHistory } from '@purpose/api-client';
import { useSessionStore } from '@/store/use-session-store';
import { useQuestsStore } from '@/store/use-quests-store';

export function JourneyRoot() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const initializeQuests = useQuestsStore((state) => state.initialize);
  const questResponses = useQuestsStore((state) => state.responses);
  const questsLoading = useQuestsStore((state) => state.isLoading);
  const questsError = useQuestsStore((state) => state.error);

  const [userMessageCount, setUserMessageCount] = useState(0);
  const [reportSummary, setReportSummary] = useState<{
    constraint: string | null;
    topValue: string | null;
  }>({ constraint: null, topValue: null });
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);

  const isReady = Boolean(user?.legalAcceptedAt);

  useEffect(() => {
    if (!isReady) {
      router.replace('/onboarding');
      return;
    }
    void initializeQuests();
    setIsLoadingChat(true);
    fetchChatHistory()
      .then((history) => {
        const userMessages = history.messages.filter((message) => message.role === 'user').length;
        setUserMessageCount(userMessages);
        const content = history.report?.content as
          | { summary?: { constraint?: string | null; topValueLabel?: string | null } }
          | undefined;
        setReportSummary({
          constraint: content?.summary?.constraint ?? null,
          topValue: content?.summary?.topValueLabel ?? null,
        });
        setChatError(null);
      })
      .catch((error) => {
        setChatError(error instanceof Error ? error.message : 'Failed to load chat insights.');
      })
      .finally(() => {
        setIsLoadingChat(false);
      });
  }, [initializeQuests, isReady, router]);

  const achievements = useMemo(() => {
    const questsCompleted = questResponses.length;
    return [
      {
        title: 'Quests completed',
        value: questsCompleted,
        description: questsCompleted > 0 ? 'Keep the cadence going.' : 'Daily quests await.',
      },
      {
        title: 'Chat exchanges',
        value: userMessageCount,
        description: userMessageCount > 0 ? 'Fermi is learning your patterns.' : 'Say hi to Fermi in chat.',
      },
      {
        title: 'Primary constraint',
        value: reportSummary.constraint ? 'Captured' : 'Not yet',
        description: reportSummary.constraint ?? 'Add your constraint to sharpen coaching. ',
      },
    ];
  }, [questResponses.length, reportSummary.constraint, userMessageCount]);

  const reports = useMemo(() => {
    return [
      {
        id: 'personal-insights',
        title: 'Personal Insights Report',
        summary: reportSummary.topValue
          ? `North-star value: ${reportSummary.topValue}`
          : 'Generated after your onboarding assessment.',
      },
    ];
  }, [reportSummary.topValue]);

  if (!isReady) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-8 text-sm text-muted sm:rounded-3xl sm:p-10">
        Redirecting to onboarding…
      </div>
    );
  }

  if (questsLoading || isLoadingChat) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-8 text-sm text-muted sm:rounded-3xl sm:p-10">
        Loading your journey…
      </div>
    );
  }

  if (questsError || chatError) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-8 text-sm text-muted sm:rounded-3xl sm:p-10">
        {questsError ?? chatError}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Journey overview
        </span>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Track how Purpose evolves with you</h1>
        <p className="text-sm text-muted">
          We surface your momentum across quests, chats, and insights so you can see progress at
          a glance.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.title}
            className="rounded-2xl border border-border bg-surface-muted p-5 shadow-sm sm:rounded-3xl sm:p-6"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {achievement.title}
            </span>
            <p className="mt-3 text-3xl font-semibold text-foreground">{achievement.value}</p>
            <p className="mt-2 text-sm text-muted">{achievement.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-surface px-5 py-6 sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Insights archive
            </span>
            <h2 className="text-lg font-semibold text-foreground">Reports generated so far</h2>
          </div>
          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto"
            onClick={() => router.push('/reports/personal-insights')}
          >
            Open report
          </button>
        </div>
        <ul className="flex flex-col gap-3 text-sm text-muted">
          {reports.map((report) => (
            <li
              key={report.id}
              className="flex flex-col rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm"
            >
              <span className="text-foreground">{report.title}</span>
              <span className="text-xs text-muted">{report.summary}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
