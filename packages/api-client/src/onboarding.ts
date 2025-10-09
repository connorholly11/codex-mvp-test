import { z } from 'zod';

export const genderOptions = ['male', 'female', 'non-binary', 'prefer-not'] as const;
export const fulfillmentDomains = ['health', 'work', 'confidence', 'relationships', 'social'] as const;

const fulfillmentShape = fulfillmentDomains.reduce(
  (shape, domain) => ({
    ...shape,
    [domain]: z.number().min(1).max(5).optional(),
  }),
  {} as Record<(typeof fulfillmentDomains)[number], z.ZodOptional<z.ZodNumber>>,
);

export const onboardingDemographicsSchema = z.object({
  age: z.number().int().min(18).max(120).optional(),
  gender: z.enum(genderOptions).optional(),
  occupation: z.string().max(200).optional(),
});

export const onboardingFulfillmentSchema = z.object(fulfillmentShape);

export const onboardingPersonalitySchema = z.record(z.string(), z.number().min(1).max(5));

export const onboardingValuesSchema = z.object({
  firstRound: z.array(z.string()),
  secondRound: z.array(z.string()),
  finalRound: z.array(z.string()),
});

export const onboardingReflectionsSchema = z.object({
  desire: z
    .string()
    .max(2000)
    .optional()
    .transform((value) => (value ?? '').trim() || undefined),
  avoidance: z
    .string()
    .max(2000)
    .optional()
    .transform((value) => (value ?? '').trim() || undefined),
});

export const onboardingDataSchema = z.object({
  demographics: onboardingDemographicsSchema,
  fulfillment: onboardingFulfillmentSchema,
  constraint: z
    .string()
    .max(2000)
    .optional()
    .transform((value) => (value ?? '').trim() || undefined),
  personality: onboardingPersonalitySchema,
  values: onboardingValuesSchema,
  reflections: onboardingReflectionsSchema,
});

export const onboardingProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  legalAcceptedAt: z.string().datetime().optional(),
});

export const onboardingPayloadSchema = z.object({
  onboarding: onboardingDataSchema,
  profile: onboardingProfileSchema,
});

export type OnboardingData = z.infer<typeof onboardingDataSchema>;
export type OnboardingPayload = z.infer<typeof onboardingPayloadSchema>;
