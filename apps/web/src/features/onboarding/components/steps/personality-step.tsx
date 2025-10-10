'use client';

import type {
  OnboardingStepComponentProps,
  PersonalityQuestionId,
} from '@/features/onboarding/types';

const QUESTIONS: { id: PersonalityQuestionId; prompt: string }[] = [
  { id: 'bfi-1', prompt: 'I see myself as someone who is outgoing, sociable.' },
  { id: 'bfi-2', prompt: 'I see myself as someone who tends to find fault with others.' },
  { id: 'bfi-3', prompt: 'I see myself as someone who does a thorough job.' },
  { id: 'bfi-4', prompt: 'I see myself as someone who is relaxed, handles stress well.' },
  { id: 'bfi-5', prompt: 'I see myself as someone who has a vivid imagination.' },
  { id: 'bfi-6', prompt: 'I see myself as someone who is reserved.' },
  { id: 'bfi-7', prompt: 'I see myself as someone who is helpful and unselfish with others.' },
  { id: 'bfi-8', prompt: 'I see myself as someone who can be somewhat careless.' },
  { id: 'bfi-9', prompt: 'I see myself as someone who is easily upset.' },
  { id: 'bfi-10', prompt: 'I see myself as someone who is curious about many different things.' },
  { id: 'bfi-11', prompt: 'I see myself as someone who is full of energy.' },
  { id: 'bfi-12', prompt: 'I see myself as someone who starts quarrels with others.' },
  { id: 'bfi-13', prompt: 'I see myself as someone who is dependable and self-disciplined.' },
];

const SCALE_LABELS = [
  'Disagree strongly',
  'Disagree a little',
  'Neutral',
  'Agree a little',
  'Agree strongly',
];

export function PersonalityStep({
  data,
  onBack,
  onContinue,
  updateData,
}: OnboardingStepComponentProps) {
  const responses = data.personality;
  const allAnswered = QUESTIONS.every((question) => typeof responses[question.id] === 'number');

  const handleChange = (questionId: PersonalityQuestionId, value: number) => {
    updateData((draft) => {
      draft.personality[questionId] = value;
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Step 4 of 6
        </p>
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Your personality snapshot</h2>
        <p className="text-sm text-muted">
          Rate how much each statement sounds like you. Use the full range to reflect your
          authentic self.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        {QUESTIONS.map((question) => {
          const selectedScore = responses[question.id];
          return (
            <div key={question.id} className="rounded-2xl border border-border bg-surface-muted p-5">
              <p className="mb-4 text-sm text-foreground">{question.prompt}</p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {SCALE_LABELS.map((label, index) => {
                    const score = index + 1;
                    const isSelected = selectedScore === score;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleChange(question.id, score)}
                        className={`inline-flex min-w-[120px] flex-1 items-center justify-center rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          isSelected
                            ? 'border-transparent bg-accent text-accent-foreground'
                            : 'border-border bg-transparent text-muted hover:bg-surface'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
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
