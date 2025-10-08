'use client';

import { ChangeEvent } from 'react';
import type { OnboardingStepComponentProps } from '@/features/onboarding/types';

const MIN_LENGTH = 10;

export function ConstraintStep({
  data,
  onBack,
  onContinue,
  updateData,
}: OnboardingStepComponentProps) {
  const constraint = data.constraint ?? '';

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    updateData((draft) => {
      draft.constraint = value;
    });
  };

  const canContinue = constraint.trim().length >= MIN_LENGTH;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Step 3 of 6
        </p>
        <h2 className="text-3xl font-semibold text-foreground">
          What’s holding you back the most?
        </h2>
        <p className="text-sm text-muted">
          Capture the single biggest obstacle standing between you and the life you want.
          The more specific you are, the better Purpose can tailor recommendations.
        </p>
      </header>

      <label className="flex flex-col gap-3 text-sm">
        <span className="text-muted">Describe the main constraint you feel right now.</span>
        <textarea
          value={constraint}
          onChange={handleChange}
          minLength={MIN_LENGTH}
          rows={6}
          className="resize-none rounded-2xl border border-border bg-surface-muted px-4 py-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <span className="text-xs text-muted">
          {Math.max(constraint.trim().length, 0)} / minimum {MIN_LENGTH} characters
        </span>
      </label>

      <footer className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
      </footer>
    </div>
  );
}
