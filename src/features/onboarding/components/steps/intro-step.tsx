'use client';

import type { OnboardingStepComponentProps } from '@/features/onboarding/types';

export function IntroStep({ onContinue }: OnboardingStepComponentProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Meet Fermi
        </span>
        <h2 className="text-3xl font-semibold text-foreground">
          Hi, I’m Fermi. Ready to dive in?
        </h2>
        <p className="text-sm leading-6 text-muted">
          This assessment helps Purpose learn how to support you. It takes about
          10–15 minutes. Find a calm moment, answer honestly, and we’ll craft a
          tailored report on the other side. Everything you enter stays on this
          device for the prototype.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Let’s do this
        </button>
      </div>
    </div>
  );
}
