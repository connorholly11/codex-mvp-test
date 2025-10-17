'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import type { GenderOption, OnboardingStepComponentProps } from '@/features/onboarding/types';

const GENDER_OPTIONS: { value: GenderOption; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not', label: 'Prefer not to say' },
];

const OCCUPATION_OPTIONS = [
  { value: 'software', label: 'Software engineer' },
  { value: 'product', label: 'Product manager' },
  { value: 'design', label: 'Designer / creative' },
  { value: 'student', label: 'Student' },
  { value: 'entrepreneur', label: 'Entrepreneur' },
  { value: 'parent', label: 'Parent or caregiver' },
  { value: 'healthcare', label: 'Healthcare professional' },
  { value: 'education', label: 'Educator' },
  { value: 'operations', label: 'Operations / leadership' },
  { value: 'custom', label: 'Something else' },
] as const;

const PRESET_OCCUPATION_LABELS = OCCUPATION_OPTIONS.filter((option) => option.value !== 'custom').map(
  (option) => option.label,
);
const PRESET_OCCUPATION_LOOKUP = new Set<string>(PRESET_OCCUPATION_LABELS);

const AGE_MIN = 18;
const AGE_MAX = 120;

const AGE_KEYPAD_ROWS: string[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['Clear', '0', 'Back'],
];

export function DemographicsStep({
  data,
  onBack,
  onContinue,
  updateData,
}: OnboardingStepComponentProps) {
  const { age, gender, occupation } = data.demographics;

  const [ageInput, setAgeInput] = useState(() => (age ? String(age) : ''));
  const [isCustomOccupation, setIsCustomOccupation] = useState(() =>
    occupation ? !PRESET_OCCUPATION_LOOKUP.has(occupation) : false,
  );
  const [customOccupation, setCustomOccupation] = useState(() =>
    occupation && !PRESET_OCCUPATION_LOOKUP.has(occupation) ? occupation : '',
  );

  useEffect(() => {
    setAgeInput(age ? String(age) : '');
  }, [age]);

  useEffect(() => {
    const nextIsCustom = occupation ? !PRESET_OCCUPATION_LOOKUP.has(occupation) : false;
    setIsCustomOccupation(nextIsCustom);
    setCustomOccupation(nextIsCustom ? occupation ?? '' : '');
  }, [occupation]);

  const applyAgeInput = (nextValue: string) => {
    const cleaned = nextValue.replace(/[^0-9]/g, '');
    const normalized = cleaned.replace(/^0+/, '').slice(0, 3);
    setAgeInput(normalized);

    if (!normalized) {
      updateData((draft) => {
        draft.demographics.age = undefined;
      });
      return;
    }

    const numeric = Number.parseInt(normalized, 10);
    if (!Number.isNaN(numeric) && numeric >= AGE_MIN && numeric <= AGE_MAX) {
      updateData((draft) => {
        draft.demographics.age = numeric;
      });
    } else {
      updateData((draft) => {
        draft.demographics.age = undefined;
      });
    }
  };

  const handleKeypadPress = (token: string) => {
    if (token === 'Clear') {
      applyAgeInput('');
      return;
    }
    if (token === 'Back') {
      applyAgeInput(ageInput.slice(0, -1));
      return;
    }
    applyAgeInput(`${ageInput}${token}`);
  };

  const handleGenderSelect = (value: GenderOption) => {
    updateData((draft) => {
      draft.demographics.gender = value;
    });
  };

  const handleOccupationSelect = (
    option: (typeof OCCUPATION_OPTIONS)[number],
  ) => {
    if (option.value === 'custom') {
      setIsCustomOccupation(true);
      updateData((draft) => {
        const trimmed = customOccupation.trim();
        draft.demographics.occupation = trimmed.length > 1 ? trimmed : undefined;
      });
      return;
    }

    setIsCustomOccupation(false);
    setCustomOccupation('');
    updateData((draft) => {
      draft.demographics.occupation = option.label;
    });
  };

  const handleCustomOccupationChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const next = event.target.value;
    setCustomOccupation(next);
    updateData((draft) => {
      const trimmed = next.trim();
      draft.demographics.occupation = trimmed.length > 1 ? trimmed : undefined;
    });
  };

  const ageNumber = typeof age === 'number' ? age : undefined;
  const isAgeValid = Boolean(ageNumber && ageNumber >= AGE_MIN && ageNumber <= AGE_MAX);
  const showAgeError = ageInput.length >= 2 && !isAgeValid;
  const occupationIsFilled = Boolean((occupation ?? '').trim().length > 1);
  const canContinue = Boolean(isAgeValid && gender && occupationIsFilled);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Step 1 of 6
        </p>
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Tell me about yourself
        </h2>
        <p className="text-sm text-muted">
          We use your demographic snapshot to tailor tone, pacing, and relevant examples.
          Nothing is shared beyond this device.
        </p>
      </header>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-sm text-muted">How old are you?</span>
          <div className="rounded-2xl border border-border bg-surface-muted p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">
                Your age
              </span>
              <span className="text-2xl font-semibold text-foreground">
                {ageInput ? ageInput : '--'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {AGE_KEYPAD_ROWS.map((row) =>
                row.map((token) => (
                  <button
                    key={`${token}-${ageInput}-${row.join('-')}`}
                    type="button"
                    onClick={() => handleKeypadPress(token)}
                    className="flex h-12 items-center justify-center rounded-xl border border-border bg-surface text-sm font-semibold text-foreground transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {token}
                  </button>
                )),
              )}
            </div>
            <p className="mt-3 text-xs text-muted">
              Age must land between {AGE_MIN} and {AGE_MAX}.
            </p>
            {showAgeError ? (
              <p className="mt-1 text-xs font-semibold text-accent">
                Keep tapping until your age lands between {AGE_MIN} and {AGE_MAX}.
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm text-muted">How do you identify?</span>
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((option) => {
              const isSelected = gender === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleGenderSelect(option.value)}
                  aria-pressed={isSelected}
                  className={`inline-flex min-w-[140px] flex-1 items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isSelected
                      ? 'border-transparent bg-accent text-accent-foreground'
                      : 'border-border bg-surface-muted text-muted hover:bg-surface'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm text-muted">
            What best describes your primary occupation?
          </span>
          <div className="flex flex-wrap gap-2">
            {OCCUPATION_OPTIONS.map((option) => {
              const isSelected =
                option.value === 'custom'
                  ? isCustomOccupation
                  : !isCustomOccupation && occupation === option.label;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOccupationSelect(option)}
                  aria-pressed={isSelected}
                  className={`inline-flex min-w-[180px] flex-1 items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isSelected
                      ? 'border-transparent bg-accent text-accent-foreground'
                      : 'border-border bg-surface-muted text-muted hover:bg-surface'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {isCustomOccupation ? (
            <input
              type="text"
              value={customOccupation}
              onChange={handleCustomOccupationChange}
              placeholder="Add your role or focus area"
              className="mt-2 rounded-2xl border border-border bg-surface-muted px-4 py-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          ) : null}
          {isCustomOccupation ? (
            <p className="text-xs text-muted">
              Share a short description (e.g., &ldquo;Climate non-profit founder&rdquo;).
            </p>
          ) : null}
        </div>
      </section>

      <footer className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex w-full items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto"
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
          className="inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Continue
        </button>
      </footer>
    </div>
  );
}
