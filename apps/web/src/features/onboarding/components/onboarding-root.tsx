'use client';

import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/features/onboarding/components/onboarding-wizard';
import { logEvent } from '@/lib/analytics';

export function OnboardingRoot() {
  const router = useRouter();

  return (
    <OnboardingWizard
      onComplete={() => {
        logEvent('onboarding_completed');
        router.push('/chat');
      }}
    />
  );
}
