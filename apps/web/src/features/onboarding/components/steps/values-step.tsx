'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const rawSelections = useMemo<ValueOption[]>(
    () => (data.values.finalRound ?? []) as ValueOption[],
    [data.values.finalRound],
  );
  const [slotSelections, setSlotSelections] = useState<(ValueOption | undefined)[]>(() =>
    POSITION_LABELS.map((_, index) => rawSelections[index]),
  );

  useEffect(() => {
    const next = POSITION_LABELS.map((_, index) => rawSelections[index]);
    setSlotSelections((current) => {
      const isSameLength = current.length === next.length;
      const isSame =
        isSameLength && next.every((value, index) => current[index] === value);
      return isSame ? current : next;
    });
  }, [rawSelections]);

  useEffect(() => {
    const filtered = slotSelections.filter(
      (value): value is ValueOption => Boolean(value),
    );
    const isSameLength = filtered.length === rawSelections.length;
    const isSame =
      isSameLength && filtered.every((value, index) => rawSelections[index] === value);
    if (isSame) {
      return;
    }

    updateData((draft) => {
      draft.values.finalRound = filtered;
      draft.values.firstRound = Array.from(new Set(filtered));
      draft.values.secondRound = draft.values.firstRound;
    });
  }, [rawSelections, slotSelections, updateData]);

  const handleSelect = (position: number, value: ValueOption) => {
    setSlotSelections((previous) => {
      return previous.map((slot, index) => {
        if (index === position) {
          return value;
        }
        if (slot === value) {
          return undefined;
        }
        return slot;
      });
    });
  };

  const handleClear = (position: number) => {
    setSlotSelections((previous) => {
      const next = [...previous];
      for (let index = position; index < next.length; index += 1) {
        next[index] = undefined;
      }
      return next;
    });
  };

  const canContinue = slotSelections.every(Boolean);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Step 5 of 6
        </p>
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
          What matters most to you?
        </h2>
        <p className="text-sm text-muted">
          Choose the three values that feel most essential right now and order them from most
          to least important. We’ll use these to align future quests and coaching prompts.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {POSITION_LABELS.map((label, index) => {
          const selectedValue = slotSelections[index];
          const isPositionLocked = index > 0 && !slotSelections[index - 1];
          return (
            <div key={label} className="flex flex-col gap-2 text-sm">
              <span className="text-muted">{label}</span>
              <div className="flex flex-wrap gap-2">
                {VALUE_OPTIONS.map((option) => {
                  const isSelected = selectedValue === option.value;
                  const isAlreadyChosen = slotSelections.some(
                    (slot, slotIndex) => slot === option.value && slotIndex !== index,
                  );
                  const isDisabled = (!isSelected && isAlreadyChosen) || isPositionLocked;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(index, option.value)}
                      aria-pressed={isSelected}
                      disabled={isDisabled}
                      className={`inline-flex min-w-[180px] flex-1 items-center justify-center rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isSelected
                          ? 'border-transparent bg-accent text-accent-foreground'
                          : 'border-border bg-surface-muted text-muted hover:bg-surface'
                      } ${isDisabled ? 'opacity-50' : ''}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => handleClear(index)}
                  disabled={!slotSelections[index]}
                  className="inline-flex min-w-[120px] items-center justify-center rounded-2xl border border-transparent bg-surface px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
