import type { OnboardingData as SharedOnboardingData } from '@purpose/api-client/onboarding';

export type GenderOption = 'male' | 'female' | 'non-binary' | 'prefer-not';

export type FulfillmentDomain =
  | 'health'
  | 'work'
  | 'confidence'
  | 'relationships'
  | 'social';

export type PersonalityQuestionId = `bfi-${number}`;

export type ValueOption =
  | 'own-time'
  | 'new-experiences'
  | 'fun-pleasure'
  | 'achieve-success'
  | 'have-control'
  | 'feel-safe'
  | 'be-liked'
  | 'honor-tradition'
  | 'generosity'
  | 'equality-inclusion';

export type ReflectionQuestionId = 'desire' | 'avoidance';

export type OnboardingStepId =
  | 'intro'
  | 'demographics'
  | 'fulfillment'
  | 'constraint'
  | 'personality'
  | 'values'
  | 'reflections'
  | 'processing'
  | 'account'
  | 'legal'
  | 'complete';

export type OnboardingData = SharedOnboardingData;

export type OnboardingUpdateFn = (updater: (draft: OnboardingData) => void) => void;

export type OnboardingStoreState = {
  step: OnboardingStepId;
  completedSteps: OnboardingStepId[];
  data: OnboardingData;
  setStep: (step: OnboardingStepId) => void;
  markStepComplete: (step: OnboardingStepId) => void;
  updateData: OnboardingUpdateFn;
  reset: () => void;
};

export type OnboardingStepComponentProps = {
  data: OnboardingData;
  onContinue: () => void;
  onBack?: () => void;
  updateData: OnboardingUpdateFn;
  isSubmitting?: boolean;
  submissionError?: string | null;
};
