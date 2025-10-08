'use client';

import { useMemo, useState } from 'react';
import { useSessionStore } from '@/store/use-session-store';
import type { OnboardingStepComponentProps } from '@/features/onboarding/types';

export function LegalStep({ onBack, onContinue }: OnboardingStepComponentProps) {
  const user = useSessionStore((state) => state.user);
  const updateUser = useSessionStore((state) => state.updateUser);

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acknowledgeCoaching, setAcknowledgeCoaching] = useState(false);

  const canContinue = useMemo(() => acceptTerms && acknowledgeCoaching, [acceptTerms, acknowledgeCoaching]);

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }
    if (user) {
      updateUser({ legalAcceptedAt: new Date().toISOString() });
    }
    onContinue();
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Agreements
        </p>
        <h2 className="text-3xl font-semibold text-foreground">Coaching, not therapy</h2>
        <p className="text-sm text-muted">
          Purpose offers AI-powered coaching. It is not a substitute for therapy, medical
          advice, or emergency services. By continuing you acknowledge these boundaries.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-muted p-6 text-sm">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(event) => setAcceptTerms(event.target.checked)}
            className="mt-1 h-5 w-5 rounded border border-border"
          />
          <span className="text-muted">
            I have read and accept the Purpose Terms of Use and Privacy Policy for this
            internal prototype.
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={acknowledgeCoaching}
            onChange={(event) => setAcknowledgeCoaching(event.target.checked)}
            className="mt-1 h-5 w-5 rounded border border-border"
          />
          <span className="text-muted">
            I understand that Purpose provides coaching, not therapy, and that I should
            contact emergency services if I am in crisis.
          </span>
        </label>
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
          onClick={handleContinue}
          disabled={!canContinue}
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Accept & continue
        </button>
      </footer>
    </div>
  );
}
