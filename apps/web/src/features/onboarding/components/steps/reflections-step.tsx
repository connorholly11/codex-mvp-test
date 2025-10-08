'use client';

import { ChangeEvent } from 'react';
import type {
  OnboardingStepComponentProps,
  ReflectionQuestionId,
} from '@/features/onboarding/types';

const QUESTIONS: { id: ReflectionQuestionId; title: string; prompt: string }[] = [
  {
    id: 'desire',
    title: 'What do you want?',
    prompt:
      'Think about your life as a whole. What do you truly want? Not what you think you should want—what you actually want.',
  },
  {
    id: 'avoidance',
    title: 'What are you avoiding?',
    prompt:
      'What truth or reality are you avoiding looking at directly? What makes you uncomfortable to think about?',
  },
];

const MIN_LENGTH = 20;

export function ReflectionsStep({
  data,
  onBack,
  onContinue,
  updateData,
}: OnboardingStepComponentProps) {
  const responses = data.reflections;

  const handleChange = (
    questionId: ReflectionQuestionId,
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = event.target.value;
    updateData((draft) => {
      draft.reflections[questionId] = value;
    });
  };

  const allAnswered = QUESTIONS.every((question) => {
    const answer = responses[question.id];
    return typeof answer === 'string' && answer.trim().length >= MIN_LENGTH;
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Step 6 of 6
        </p>
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Two final reflections</h2>
        <p className="text-sm text-muted">
          Take a moment to write from the heart. Fermi uses these responses to frame your
          Personal Insights report.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {QUESTIONS.map((question) => {
          const answer = responses[question.id] ?? '';
          return (
            <label key={question.id} className="flex flex-col gap-3 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {question.title}
                </span>
                <span className="text-muted">{question.prompt}</span>
              </div>
              <textarea
                value={answer}
                onChange={(event) => handleChange(question.id, event)}
                rows={6}
                className="resize-none rounded-2xl border border-border bg-surface-muted px-4 py-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <span className="text-xs text-muted">
                {Math.max(answer.trim().length, 0)} / minimum {MIN_LENGTH} characters
              </span>
            </label>
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
