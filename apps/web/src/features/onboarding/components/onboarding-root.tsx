'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboarding } from '@purpose/api-client';
import { OnboardingWizard } from '@/features/onboarding/components/onboarding-wizard';
import { logEvent } from '@/lib/analytics';
import { useOnboardingStore } from '@/store/use-onboarding-store';
import { useSessionStore } from '@/store/use-session-store';

export function OnboardingRoot() {
  const router = useRouter();
  const onboardingData = useOnboardingStore((state) => state.data);
  const resetOnboarding = useOnboardingStore((state) => state.reset);
  const user = useSessionStore((state) => state.user);
  const updateUser = useSessionStore((state) => state.updateUser);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!user) {
      setSubmissionError('Please make sure you have confirmed your magic link before continuing.');
      return;
    }

    const legalAcceptedAt = user.legalAcceptedAt ?? new Date().toISOString();

    try {
      setIsSubmitting(true);
      setSubmissionError(null);

      await submitOnboarding({
        onboarding: onboardingData,
        profile: {
          displayName: user.displayName ?? user.email,
          legalAcceptedAt,
        },
      });

      if (!user.legalAcceptedAt) {
        updateUser({ legalAcceptedAt });
      }

      resetOnboarding();
      logEvent('onboarding_completed');
      router.push('/chat');
    } catch (error) {
      console.error('Failed to submit onboarding', error);
      setSubmissionError('We hit a snag saving your assessment. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingWizard
      onComplete={handleComplete}
      isSubmitting={isSubmitting}
      submissionError={submissionError}
    />
  );
}
