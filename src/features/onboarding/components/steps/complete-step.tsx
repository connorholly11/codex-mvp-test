'use client';

import type { OnboardingStepComponentProps } from '@/features/onboarding/types';
import { useSessionStore } from '@/store/use-session-store';

export function CompleteStep({ onContinue }: OnboardingStepComponentProps) {
  const user = useSessionStore((state) => state.user);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="h-16 w-16 rounded-full bg-accent/20 p-4">
        <div className="h-full w-full rounded-full bg-accent" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          You’re all set
        </span>
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Welcome in, {user?.name?.split(' ')[0] ?? 'friend'}.
        </h2>
        <p className="max-w-xl text-sm text-muted">
          Your assessment is saved locally. Head to the chat to meet Fermi, review your
          Personal Insights report, and continue the journey.
        </p>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto"
      >
        Enter the chat
      </button>
    </div>
  );
}
