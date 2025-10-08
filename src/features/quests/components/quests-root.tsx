'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUESTS } from '@/features/quests/data/quests';
import { QuestModal } from '@/features/quests/components/quest-modal';
import { useQuestsStore } from '@/store/use-quests-store';
import { useSessionStore } from '@/store/use-session-store';
import { logEvent } from '@/lib/analytics';

export function QuestsRoot() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const statuses = useQuestsStore((state) => state.statuses);
  const completeQuest = useQuestsStore((state) => state.completeQuest);
  const responses = useQuestsStore((state) => state.responses);

  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [celebratedQuestId, setCelebratedQuestId] = useState<string | null>(null);

  const isReady = Boolean(user?.legalAcceptedAt);

  useEffect(() => {
    if (!isReady) {
      router.replace('/onboarding');
    }
  }, [isReady, router]);

  const activeQuest = QUESTS.find((quest) => quest.id === activeQuestId) ?? null;
  const celebratedQuest = QUESTS.find((quest) => quest.id === celebratedQuestId) ?? null;

  if (!isReady) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-10 text-sm text-muted">
        Redirecting to onboarding…
      </div>
    );
  }

  const handleComplete = (questId: string, answer: string | number) => {
    completeQuest(questId, answer);
    logEvent('quest_completed', { questId, answer });
    setActiveQuestId(null);
    setCelebratedQuestId(questId);
    window.setTimeout(() => setCelebratedQuestId(null), 4000);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Daily quests
        </span>
        <h1 className="text-3xl font-semibold text-foreground">Stay in motion between chats</h1>
        <p className="text-sm text-muted">
          These prompts sharpen Fermi’s understanding of you and encourage small but meaningful
          moments of reflection each day.
        </p>
      </header>

      {celebratedQuest ? (
        <div className="rounded-3xl border border-accent bg-accent/10 px-4 py-3 text-sm text-accent">
          Quest “{celebratedQuest.title}” completed – nice work.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {QUESTS.map((quest) => {
          const status = statuses[quest.id] ?? 'available';
          const isCompleted = status === 'completed';
          return (
            <article
              key={quest.id}
              className="flex h-full flex-col justify-between rounded-3xl border border-border bg-surface-muted p-6"
            >
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {quest.estimatedMinutes} min
                </span>
                <h2 className="text-lg font-semibold text-foreground">{quest.title}</h2>
                <p className="text-sm text-muted">{quest.description}</p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted">
                <span>{quest.type.toUpperCase()}</span>
                <span className={isCompleted ? 'text-accent' : ''}>
                  {isCompleted ? 'Completed' : 'Available'}
                </span>
              </div>
              <button
                type="button"
                disabled={isCompleted}
                onClick={() => setActiveQuestId(quest.id)}
                className="mt-6 inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCompleted ? 'Completed' : 'Start quest'}
              </button>
            </article>
          );
        })}
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6">
        <h2 className="mb-3 text-base font-semibold text-foreground">Quest history</h2>
        {responses.length === 0 ? (
          <p className="text-sm text-muted">Complete a quest to see your responses here.</p>
        ) : (
          <ul className="flex flex-col gap-3 text-sm text-muted">
            {responses
              .slice()
              .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
              .map((response) => {
                const quest = QUESTS.find((item) => item.id === response.questId);
                if (!quest) {
                  return null;
                }
                return (
                  <li key={response.questId} className="flex flex-col">
                    <span className="text-foreground">{quest.title}</span>
                    <span className="text-xs text-muted">
                      {new Date(response.completedAt).toLocaleString()} –{' '}
                      {typeof response.answer === 'number' ? `Rating: ${response.answer}` : response.answer}
                    </span>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      <QuestModal
        quest={activeQuest}
        onClose={() => setActiveQuestId(null)}
        onComplete={(answer) => {
          if (activeQuest) {
            handleComplete(activeQuest.id, answer);
          }
        }}
      />
    </div>
  );
}
