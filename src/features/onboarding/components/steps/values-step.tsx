'use client';

import type { OnboardingStepComponentProps, ValueOption } from '@/features/onboarding/types';

const VALUE_OPTIONS: { value: ValueOption; label: string }[] = [
  { value: 'own-time', label: 'Own your time (Self-direction)' },
  { value: 'new-experiences', label: 'New experiences (Stimulation)' },
  { value: 'fun-pleasure', label: 'Fun & pleasure (Hedonism)' },
  { value: 'achieve-success', label: 'Achieve success (Achievement)' },
  { value: 'have-control', label: 'Have control (Power)' },
  { value: 'feel-safe', label: 'Feel safe (Security)' },
  { value: 'be-liked', label: 'Be liked by others (Conformity)' },
  { value: 'honor-tradition', label: 'Honor tradition (Tradition)' },
  { value: 'generosity', label: 'Generosity (Benevolence)' },
  { value: 'equality-inclusion', label: 'Equality & inclusion (Universalism)' },
];

const POSITION_LABELS = ['Top priority', 'Second priority', 'Third priority'];

export function ValuesStep({
  data,
  onBack,
  onContinue,
  updateData,
}: OnboardingStepComponentProps) {
  const selections = data.values.finalRound ?? [];

  const handleChange = (position: number, nextValue: ValueOption) => {
    updateData((draft) => {
      const current = draft.values.finalRound ?? [];
      const updated = [...current];
      updated[position] = nextValue;
      draft.values.finalRound = updated;
      // Mirror into the earlier rounds for this prototype scaffold.
      draft.values.firstRound = Array.from(new Set(updated.filter(Boolean)));
      draft.values.secondRound = draft.values.firstRound;
    });
  };

  const isOptionDisabled = (value: ValueOption, position: number) => {
    return selections.some((selected, index) => selected === value && index !== position);
  };

  const canContinue = selections.length === 3 && selections.every(Boolean);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Step 5 of 6
        </p>
        <h2 className="text-3xl font-semibold text-foreground">What matters most to you?</h2>
        <p className="text-sm text-muted">
          Choose the three values that feel most essential right now and order them from most
          to least important. We’ll use these to align future quests and coaching prompts.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {POSITION_LABELS.map((label, index) => (
          <label key={label} className="flex flex-col gap-2 text-sm">
            <span className="text-muted">{label}</span>
            <select
              value={selections[index] ?? ''}
              onChange={(event) => handleChange(index, event.target.value as ValueOption)}
              className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="" disabled>
                Select a value
              </option>
              {VALUE_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={isOptionDisabled(option.value, index)}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

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
