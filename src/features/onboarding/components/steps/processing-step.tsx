'use client';

import { useEffect } from 'react';
import type { OnboardingStepComponentProps } from '@/features/onboarding/types';

export function ProcessingStep({ onContinue }: OnboardingStepComponentProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onContinue();
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface px-6 py-8 text-center sm:rounded-3xl sm:px-10">
      <div className="h-14 w-14 animate-pulse rounded-full bg-accent/30" />
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Processing your insights…</h2>
        <p className="text-sm text-muted">
          Fermi is synthesizing everything you shared and preparing your Personal Insights
          report. This prototype simulates the backend processing so you can jump straight
          into the chat experience afterwards.
        </p>
      </div>
    </div>
  );
}
