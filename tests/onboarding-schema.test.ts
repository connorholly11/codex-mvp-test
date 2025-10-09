import { describe, expect, it } from 'vitest';
import {
  onboardingReflectionsSchema,
  onboardingPayloadSchema,
  genderOptions,
  fulfillmentDomains,
} from '@purpose/api-client/onboarding';

const basePayload = {
  onboarding: {
    demographics: {
      age: 28,
      gender: genderOptions[0],
      occupation: 'Engineer',
    },
    fulfillment: Object.fromEntries(fulfillmentDomains.map((domain, index) => [domain, (index % 5) + 1])) as Record<
      (typeof fulfillmentDomains)[number],
      number
    >,
    constraint: 'Imposter syndrome creeping in during launches.',
    personality: {
      'bfi-1': 4,
      'bfi-2': 3,
      'bfi-3': 5,
    },
    values: {
      firstRound: ['own-time', 'new-experiences', 'fun-pleasure', 'achieve-success', 'have-control'],
      secondRound: ['own-time', 'new-experiences', 'have-control', 'feel-safe', 'be-liked'],
      finalRound: ['own-time', 'have-control', 'feel-safe'],
    },
    reflections: {
      desire: 'Build a sustainable creator business.',
      avoidance: 'Naming that I am afraid to disappoint future clients.',
    },
  },
  profile: {
    displayName: 'Taylor Purpose',
    legalAcceptedAt: new Date().toISOString(),
  },
} satisfies unknown;

describe('onboardingReflectionsSchema', () => {
  it('trims whitespace and drops empty reflections', () => {
    const parsed = onboardingReflectionsSchema.parse({
      desire: '   Ship the MVP.  ',
      avoidance: '  ',
    });

    expect(parsed.desire).toBe('Ship the MVP.');
    expect(parsed.avoidance).toBeUndefined();
  });
});

describe('onboardingPayloadSchema', () => {
  it('accepts a valid payload', () => {
    expect(() => onboardingPayloadSchema.parse(basePayload)).not.toThrow();
  });

  it('rejects invalid display names', () => {
    const invalid = {
      ...basePayload,
      profile: { ...basePayload.profile, displayName: 'a' },
    };
    expect(() => onboardingPayloadSchema.parse(invalid)).toThrow();
  });
});
