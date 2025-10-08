'use client';

import { ChangeEvent } from 'react';
import type { GenderOption, OnboardingStepComponentProps } from '@/features/onboarding/types';

const GENDER_OPTIONS: { value: GenderOption; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not', label: 'Prefer not to say' },
];

export function DemographicsStep({
  data,
  onBack,
  onContinue,
  updateData,
}: OnboardingStepComponentProps) {
  const { age, gender, occupation } = data.demographics;

  const handleAgeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const parsed = value ? Number.parseInt(value, 10) : undefined;
    updateData((draft) => {
      draft.demographics.age = Number.isNaN(parsed) ? undefined : parsed;
    });
  };

  const handleOccupationChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    updateData((draft) => {
      draft.demographics.occupation = value;
    });
  };

  const handleGenderChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as GenderOption;
    updateData((draft) => {
      draft.demographics.gender = value;
    });
  };

  const canContinue = Boolean(age && gender && (occupation?.trim() ?? '').length > 1);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Step 1 of 6
        </p>
        <h2 className="text-3xl font-semibold text-foreground">Tell me about yourself</h2>
        <p className="text-sm text-muted">
          We use your demographic snapshot to tailor tone, pacing, and relevant examples.
          Nothing is shared beyond this device.
        </p>
      </header>

      <form className="flex flex-col gap-6">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-muted">How old are you?</span>
          <input
            type="number"
            min={18}
            max={120}
            inputMode="numeric"
            value={age ?? ''}
            onChange={handleAgeChange}
            className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-muted">How do you identify?</span>
          <select
            value={gender ?? ''}
            onChange={handleGenderChange}
            className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="" disabled>
              Select an option
            </option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-muted">What best describes your primary occupation?</span>
          <input
            type="text"
            value={occupation ?? ''}
            onChange={handleOccupationChange}
            placeholder="e.g., Product Manager, Student, Entrepreneur"
            className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>
      </form>

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
