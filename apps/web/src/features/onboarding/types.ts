export type GenderOption = "male" | "female" | "non-binary" | "prefer-not";

export type FulfillmentDomain =
  | "health"
  | "work"
  | "confidence"
  | "relationships"
  | "social";

export type PersonalityQuestionId = `bfi-${number}`;

export type ValueOption =
  | "own-time"
  | "new-experiences"
  | "fun-pleasure"
  | "achieve-success"
  | "have-control"
  | "feel-safe"
  | "be-liked"
  | "honor-tradition"
  | "generosity"
  | "equality-inclusion";

export type ReflectionQuestionId = "desire" | "avoidance";

export type OnboardingStepId =
  | "intro"
  | "demographics"
  | "fulfillment"
  | "constraint"
  | "personality"
  | "values"
  | "reflections"
  | "processing"
  | "account"
  | "legal"
  | "complete";

type Demographics = {
  age?: number;
  gender?: GenderOption;
  occupation?: string;
};

type FulfillmentRatings = Partial<Record<FulfillmentDomain, number>>;

type PersonalityResponses = Partial<Record<PersonalityQuestionId, number>>;

type ValuesRanking = {
  firstRound: ValueOption[];
  secondRound: ValueOption[];
  finalRound: ValueOption[];
};

type ReflectionResponses = Partial<Record<ReflectionQuestionId, string>>;

export type OnboardingData = {
  demographics: Demographics;
  fulfillment: FulfillmentRatings;
  constraint?: string;
  personality: PersonalityResponses;
  values: ValuesRanking;
  reflections: ReflectionResponses;
};

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
};
