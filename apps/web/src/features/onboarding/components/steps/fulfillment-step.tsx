'use client';

import type {
  FulfillmentDomain,
  OnboardingStepComponentProps,
} from '@/features/onboarding/types';

const DOMAINS: { id: FulfillmentDomain; title: string; question: string }[] = [
  {
    id: 'health',
    title: 'Physical Health & Energy',
    question: 'How satisfied are you with your physical health and energy levels?',
  },
  {
    id: 'work',
    title: 'Work & Career',
    question: 'How satisfied are you with your work and career progress?',
  },
  {
    id: 'confidence',
    title: 'Confidence & Self-Worth',
    question: 'How would you rate your overall confidence and self-worth?',
  },
  {
    id: 'relationships',
    title: 'Romantic Relationship',
    question: 'How satisfied are you with your romantic relationship or relationship life?',
  },
  {
    id: 'social',
    title: 'Social Life & Friendships',
    question: 'How satisfied are you with your social life and friendships?',
  },
];

const SCORES = [1, 2, 3, 4, 5] as const;

const SCORE_SHORT_LABELS: Record<(typeof SCORES)[number], string> = {
  1: 'Very unsatisfied',
  2: 'Unsatisfied',
  3: 'Neutral',
  4: 'Satisfied',
  5: 'Thriving',
};

export function FulfillmentStep({
  data,
  onBack,
  onContinue,
  updateData,
}: OnboardingStepComponentProps) {
  const ratings = data.fulfillment;
  const allAnswered = DOMAINS.every((domain) => {
    const value = ratings[domain.id];
    return typeof value === 'number' && value >= 1 && value <= 5;
  });

  const handleChange = (domain: FulfillmentDomain, value: number) => {
    updateData((draft) => {
      draft.fulfillment[domain] = value;
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Step 2 of 6
        </p>
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">How fulfilled do you feel?</h2>
        <p className="text-sm text-muted">
          Tap the number that reflects how satisfied you feel in each area today. 1 means
          deeply unsatisfied, 5 means thriving.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {DOMAINS.map((domain) => {
          const selectedScore = ratings[domain.id];
          return (
            <div
              key={domain.id}
              className="rounded-2xl border border-border bg-surface-muted p-5"
            >
              <div className="mb-4 flex flex-col gap-1">
                <h3 className="text-base font-semibold text-foreground">
                  {domain.title}
                </h3>
                <p className="text-xs text-muted">{domain.question}</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {SCORES.map((score) => {
                    const isSelected = selectedScore === score;
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleChange(domain.id, score)}
                        aria-pressed={isSelected}
                        className={`inline-flex flex-1 min-w-[96px] flex-col items-center justify-center gap-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          isSelected
                            ? 'border-transparent bg-accent text-accent-foreground'
                            : 'border-border bg-transparent text-muted hover:bg-surface'
                        }`}
                      >
                        <span className="text-lg font-semibold">{score}</span>
                        <span className="text-[11px] font-normal tracking-tight">
                          {SCORE_SHORT_LABELS[score]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted">
                  {selectedScore
                    ? `You chose ${
                        SCORE_SHORT_LABELS[selectedScore as (typeof SCORES)[number]]
                      }.`
                    : 'Select the number that matches how you feel today.'}
                </p>
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
          disabled={!allAnswered}
          className="inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Continue
        </button>
      </footer>
    </div>
  );
}
