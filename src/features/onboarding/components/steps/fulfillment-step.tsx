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
        <h2 className="text-3xl font-semibold text-foreground">How fulfilled do you feel?</h2>
        <p className="text-sm text-muted">
          Drag the sliders to reflect how satisfied you feel in each area today. 1 means
          deeply unsatisfied, 5 means thriving.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {DOMAINS.map((domain) => {
          const value = ratings[domain.id] ?? 3;
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
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={value}
                  onChange={(event) => handleChange(domain.id, Number(event.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted">
                  <span>Very unsatisfied</span>
                  <span className="text-sm font-semibold text-foreground">{value}</span>
                  <span>Very satisfied</span>
                </div>
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
          disabled={!allAnswered}
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
      </footer>
    </div>
  );
}
