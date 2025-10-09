import type { OnboardingData } from '@/features/onboarding/types';

export type PersonalInsightsSummary = {
  topValueLabel: string | null;
  growthAreaLabel: string | null;
  growthAreaScore: number | null;
  constraint: string | null;
};

export type PersonalInsightsSection = {
  id: string;
  title: string;
  content: string;
};

export type PersonalInsightsReport = {
  title: string;
  openingInsight: string;
  sections: PersonalInsightsSection[];
  summary: PersonalInsightsSummary;
};

function isPersonalInsightsSection(value: unknown): value is PersonalInsightsSection {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Partial<PersonalInsightsSection>;
  return (
    typeof section.id === 'string' &&
    typeof section.title === 'string' &&
    typeof section.content === 'string'
  );
}

export function parsePersonalInsightsReport(content: unknown): PersonalInsightsReport | null {
  if (!content || typeof content !== 'object') {
    return null;
  }

  const value = content as Partial<PersonalInsightsReport>;

  if (typeof value.openingInsight !== 'string') {
    return null;
  }

  const sections = Array.isArray(value.sections)
    ? (value.sections.filter(isPersonalInsightsSection) as PersonalInsightsSection[])
    : [];

  const summary = (value.summary ?? {}) as Partial<PersonalInsightsSummary>;

  return {
    title: typeof value.title === 'string' && value.title.length > 0 ? value.title : 'Your Personal Insights',
    openingInsight: value.openingInsight,
    sections,
    summary: {
      topValueLabel:
        typeof summary.topValueLabel === 'string' ? summary.topValueLabel : summary.topValueLabel ?? null,
      growthAreaLabel:
        typeof summary.growthAreaLabel === 'string'
          ? summary.growthAreaLabel
          : summary.growthAreaLabel ?? null,
      growthAreaScore:
        typeof summary.growthAreaScore === 'number' ? summary.growthAreaScore : summary.growthAreaScore ?? null,
      constraint:
        typeof summary.constraint === 'string' ? summary.constraint : summary.constraint ?? null,
    },
  };
}

const VALUE_LABELS: Record<string, string> = {
  'own-time': 'Owning your time',
  'new-experiences': 'New experiences',
  'fun-pleasure': 'Fun & pleasure',
  'achieve-success': 'Achieving success',
  'have-control': 'Having control',
  'feel-safe': 'Feeling safe',
  'be-liked': 'Being liked by others',
  'honor-tradition': 'Honouring tradition',
  generosity: 'Generosity',
  'equality-inclusion': 'Equality & inclusion',
};

const DOMAIN_LABELS: Record<string, string> = {
  health: 'Physical health & energy',
  work: 'Work & career momentum',
  confidence: 'Confidence & self-worth',
  relationships: 'Romantic relationships',
  social: 'Social life & friendships',
};

export function generatePersonalInsights(data: OnboardingData): PersonalInsightsSummary {
  const topValueKey = data.values.finalRound?.[0] ?? null;
  const topValueLabel = topValueKey ? VALUE_LABELS[topValueKey] ?? 'What matters most to you' : null;

  const fulfillmentEntries = Object.entries(data.fulfillment) as [string, number][];
  const sorted = fulfillmentEntries
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
    .sort((a, b) => a[1] - b[1]);
  const lowest = sorted[0];

  const growthAreaLabel = lowest ? DOMAIN_LABELS[lowest[0]] ?? lowest[0] : null;
  const growthAreaScore = lowest ? lowest[1] : null;

  const constraint = data.constraint ?? null;

  return {
    topValueLabel,
    growthAreaLabel,
    growthAreaScore,
    constraint,
  };
}

export function buildPersonalInsightsReport(data: OnboardingData): PersonalInsightsReport {
  const summary = generatePersonalInsights(data);

  const valueSection = summary.topValueLabel
    ? {
        id: 'values',
        title: 'Your north-star value',
        content: `You lead with **${summary.topValueLabel}**. Anchor new commitments to this priority so motivation stays clean. Ask yourself: _Does this choice expand ${summary.topValueLabel.toLowerCase()} or constrain it?_`,
      }
    : {
        id: 'values',
        title: 'Clarify what matters',
        content:
          'Your value ranking was inconclusive. Revisit the values exercise when you have a quiet five minutes to sharpen the compass you want Fermi to honour.',
      };

  const growthSection = summary.growthAreaLabel
    ? {
        id: 'growth-edge',
        title: 'Your growth edge',
        content: `The area asking for attention is **${summary.growthAreaLabel}**${
          typeof summary.growthAreaScore === 'number'
            ? `, currently at **${summary.growthAreaScore}/5**`
            : ''
        }. Start with a micro-win: choose one behaviour you can complete in under 10 minutes that nudges this area forward.`,
      }
    : {
        id: 'growth-edge',
        title: 'Scan for friction',
        content:
          'Spend a moment noticing where friction shows up most often. Spotting the lowest-satisfaction domain will help Fermi focus future quests.',
      };

  const constraintSection = summary.constraint
    ? {
        id: 'constraint',
        title: 'What’s in the way',
        content: `You named your primary constraint as: “${summary.constraint}.” Fermi will keep referencing this until we dissolve or redesign it. Expect gentle nudges to test new narratives and behaviours.`,
      }
    : {
        id: 'constraint',
        title: 'Surface the constraint',
        content:
          'You left the constraint question open. Take a beat to name the pattern that consistently slows you down—clarity here accelerates coaching.',
      };

  const reflectionSection = buildReflectionSection(data);

  const sections = [valueSection, growthSection, constraintSection, reflectionSection].filter(
    Boolean,
  ) as PersonalInsightsSection[];

  const openingInsight = buildOpeningInsight(summary, sections);

  return {
    title: 'Your Personal Insights',
    openingInsight,
    sections,
    summary,
  };
}

function buildOpeningInsight(
  summary: PersonalInsightsSummary,
  sections: PersonalInsightsSection[],
): string {
  if (summary.topValueLabel && summary.growthAreaLabel) {
    return `You’re anchored by ${summary.topValueLabel.toLowerCase()} while ${summary.growthAreaLabel.toLowerCase()} asks for honest experimentation. Let’s use that tension as fuel.`;
  }

  const titles = sections.map((section) => section.title.toLowerCase());
  return `We mapped out ${titles.join(', ')} so you have a clear starting playbook. Dip in when you want a quick re-centre.`;
}

function buildReflectionSection(data: OnboardingData): PersonalInsightsSection {
  const desire = data.reflections.desire?.trim();
  const avoidance = data.reflections.avoidance?.trim();

  if (desire || avoidance) {
    return {
      id: 'reflections',
      title: 'Your own words',
      content: [
        desire ? `**What you want:** ${desire}` : null,
        avoidance ? `**What you’re avoiding:** ${avoidance}` : null,
      ]
        .filter(Boolean)
        .join('\n\n'),
    };
  }

  return {
    id: 'reflections',
    title: 'Keep reflecting',
    content:
      'When you add your own words here they become anchor quotes inside the report and in Fermi’s coaching context. Try capturing a sentence or two next time.',
  };
}
