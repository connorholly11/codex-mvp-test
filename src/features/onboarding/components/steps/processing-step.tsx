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
    <div className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-surface p-10 text-center">
      <div className="h-14 w-14 animate-pulse rounded-full bg-accent/30" />
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-foreground">Processing your insights…</h2>
        <p className="text-sm text-muted">
          Fermi is synthesizing everything you shared and preparing your Personal Insights
          report. This prototype simulates the backend processing so you can jump straight
          into the chat experience afterwards.
        </p>
      </div>
    </div>
  );
}
