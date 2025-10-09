import { describe, expect, it } from 'vitest';
import { generatePersonalInsights, parsePersonalInsightsReport } from '@/lib/reports';
import type { OnboardingData } from '@purpose/api-client/onboarding';

const sampleOnboarding: OnboardingData = {
  demographics: { age: 32, gender: 'female', occupation: 'Product Designer' },
  fulfillment: {
    health: 2,
    work: 4,
    confidence: 3,
    relationships: 5,
    social: 4,
  },
  constraint: 'Second-guessing decisions when pressure spikes.',
  personality: {
    'bfi-1': 4,
    'bfi-2': 2,
  },
  values: {
    firstRound: ['own-time', 'new-experiences', 'fun-pleasure', 'achieve-success', 'have-control'],
    secondRound: ['own-time', 'new-experiences', 'have-control', 'feel-safe', 'be-liked'],
    finalRound: ['own-time', 'feel-safe', 'have-control'],
  },
  reflections: {
    desire: 'Build momentum behind a creative side project.',
    avoidance: 'Being honest that I feel behind and under-resourced.',
  },
};

describe('generatePersonalInsights', () => {
  it('identifies the top value and lowest satisfaction domain', () => {
    const summary = generatePersonalInsights(sampleOnboarding);

    expect(summary.topValueLabel).toBe('Owning your time');
    expect(summary.growthAreaLabel).toBe('Physical health & energy');
    expect(summary.growthAreaScore).toBe(2);
    expect(summary.constraint).toBe(sampleOnboarding.constraint);
  });
});

describe('parsePersonalInsightsReport', () => {
  it('returns a structured report when valid content is provided', () => {
    const report = parsePersonalInsightsReport({
      title: 'Your Personal Insights',
      openingInsight: 'You balance clarity with curiosity.',
      sections: [
        { id: 'values', title: 'Values', content: 'Lead with autonomy.' },
        { id: 'growth', title: 'Growth', content: 'Build recovery routines.' },
      ],
      summary: {
        topValueLabel: 'Owning your time',
        growthAreaLabel: 'Physical health & energy',
        growthAreaScore: 2,
        constraint: 'Second-guessing decisions when pressure spikes.',
      },
    });

    expect(report).not.toBeNull();
    expect(report?.sections).toHaveLength(2);
    expect(report?.summary.topValueLabel).toBe('Owning your time');
  });

  it('returns null when opening insight is missing', () => {
    const report = parsePersonalInsightsReport({
      title: 'Your Personal Insights',
      sections: [],
    });

    expect(report).toBeNull();
  });
});
