'use client';

import { useMemo } from 'react';
import type {
  OnboardingStepId,
  OnboardingStepComponentProps,
} from '@/features/onboarding/types';
import { useOnboardingStore } from '@/store/use-onboarding-store';
import { IntroStep } from '@/features/onboarding/components/steps/intro-step';
import { DemographicsStep } from '@/features/onboarding/components/steps/demographics-step';
import { FulfillmentStep } from '@/features/onboarding/components/steps/fulfillment-step';
import { ConstraintStep } from '@/features/onboarding/components/steps/constraint-step';
import { PersonalityStep } from '@/features/onboarding/components/steps/personality-step';
import { ValuesStep } from '@/features/onboarding/components/steps/values-step';
import { ReflectionsStep } from '@/features/onboarding/components/steps/reflections-step';
import { ProcessingStep } from '@/features/onboarding/components/steps/processing-step';
import { AccountStep } from '@/features/onboarding/components/steps/account-step';
import { LegalStep } from '@/features/onboarding/components/steps/legal-step';
import { CompleteStep } from '@/features/onboarding/components/steps/complete-step';

const STEP_SEQUENCE: OnboardingStepId[] = [
  'intro',
  'demographics',
  'fulfillment',
  'constraint',
  'personality',
  'values',
  'reflections',
  'processing',
  'account',
  'legal',
  'complete',
];

const STEP_COMPONENTS: Record<OnboardingStepId, (props: OnboardingStepComponentProps) => JSX.Element> = {
  intro: IntroStep,
  demographics: DemographicsStep,
  fulfillment: FulfillmentStep,
  constraint: ConstraintStep,
  personality: PersonalityStep,
  values: ValuesStep,
  reflections: ReflectionsStep,
  processing: ProcessingStep,
  account: AccountStep,
  legal: LegalStep,
  complete: CompleteStep,
};

type OnboardingWizardProps = {
  onComplete: () => void;
};

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { step, data, setStep, markStepComplete, updateData, reset } = useOnboardingStore();

  const index = useMemo(() => STEP_SEQUENCE.indexOf(step), [step]);
  const total = STEP_SEQUENCE.length;
  const progress = ((index + 1) / total) * 100;

  const goToStep = (target: OnboardingStepId) => setStep(target);

  const goForward = () => {
    const next = STEP_SEQUENCE[index + 1];
    markStepComplete(step);
    if (next) {
      goToStep(next);
    } else {
      onComplete();
    }
  };

  const goBack = () => {
    const previous = STEP_SEQUENCE[index - 1];
    if (previous) {
      goToStep(previous);
    }
  };

  const StepComponent = STEP_COMPONENTS[step];

  const showProgress = step !== 'processing' && step !== 'complete';

  return (
    <div className="flex flex-col gap-8">
      {showProgress ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            <span>Assessment progress</span>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-transparent px-3 py-1 text-[10px] font-semibold text-muted transition hover:border-border hover:text-foreground"
            >
              Reset
            </button>
          </div>
          <div className="h-2 rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      <StepComponent
        data={data}
        updateData={updateData}
        onContinue={() => {
          if (step === 'complete') {
            onComplete();
            return;
          }
          goForward();
        }}
        onBack={index > 0 && step !== 'intro' ? goBack : undefined}
      />
    </div>
  );
}
