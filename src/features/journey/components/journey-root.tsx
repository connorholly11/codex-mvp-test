'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/use-session-store';
import { useQuestsStore } from '@/store/use-quests-store';
import { useChatStore } from '@/store/use-chat-store';
import { useOnboardingStore } from '@/store/use-onboarding-store';

export function JourneyRoot() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const questResponses = useQuestsStore((state) => state.responses);
  const messages = useChatStore((state) => state.messages);
  const onboardingData = useOnboardingStore((state) => state.data);

  const isReady = Boolean(user?.legalAcceptedAt);

  useEffect(() => {
    if (!isReady) {
      router.replace('/onboarding');
    }
  }, [isReady, router]);

  const achievements = useMemo(() => {
    const questsCompleted = questResponses.length;
    const chatExchanges = messages.filter((message) => message.role === 'user').length;
    const reflectionsCompleted = ['desire', 'avoidance'].filter(
      (key) => onboardingData.reflections[key as 'desire' | 'avoidance'],
    ).length;

    return [
      {
        title: 'Quests completed',
        value: questsCompleted,
        description: questsCompleted > 0 ? 'Keep the cadence going.' : 'Daily quests await.',
      },
      {
        title: 'Chat exchanges',
        value: chatExchanges,
        description: chatExchanges > 0 ? 'Fermi is learning your patterns.' : 'Say hi to Fermi in chat.',
      },
      {
        title: 'Deep reflections',
        value: reflectionsCompleted,
        description: 'Two spotlight reflections from onboarding to revisit anytime.',
      },
    ];
  }, [messages, onboardingData.reflections, questResponses]);

  const reports = useMemo(() => {
    const onboardingReport = {
      id: 'personal-insights',
      title: 'Personal Insights Report',
      generatedAt: 'Onboarding',
      summary: onboardingData.constraint
        ? `Primary constraint: ${onboardingData.constraint.slice(0, 48)}...`
        : 'Generated after your assessment.',
    };

    return [onboardingReport];
  }, [onboardingData.constraint]);

  if (!isReady) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-10 text-sm text-muted">
        Redirecting to onboarding…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Journey overview
        </span>
        <h1 className="text-3xl font-semibold text-foreground">Track how Purpose evolves with you</h1>
        <p className="text-sm text-muted">
          This space will visualise your milestones, streaks, and evolving insights. For now it
          echoes the key signals we already capture locally.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.title}
            className="rounded-3xl border border-border bg-surface-muted p-6 shadow-sm"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {achievement.title}
            </span>
            <p className="mt-3 text-3xl font-semibold text-foreground">{achievement.value}</p>
            <p className="mt-2 text-sm text-muted">{achievement.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Insights archive
            </span>
            <h2 className="text-lg font-semibold text-foreground">Reports generated so far</h2>
          </div>
          <button
            type="button"
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => router.push('/docs')}
          >
            View spec
          </button>
        </div>
        <ul className="flex flex-col gap-3 text-sm text-muted">
          {reports.map((report) => (
            <li
              key={report.id}
              className="flex flex-col rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm"
            >
              <span className="text-foreground">{report.title}</span>
              <span className="text-xs text-muted">{report.generatedAt}</span>
              <span className="text-xs text-muted">{report.summary}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
