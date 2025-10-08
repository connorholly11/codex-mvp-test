import type { QuestDefinition } from '@/features/quests/types';

export const QUESTS: QuestDefinition[] = [
  {
    id: 'quest-energy-check-in',
    title: 'Energy check-in',
    description: 'Gauge how energised you feel to spot weekly trends.',
    type: 'likert',
    estimatedMinutes: 1,
    payload: {
      type: 'likert',
      prompt: 'Today, how energised do you feel heading into your commitments?',
      scaleLabels: ['Totally depleted', 'Fully charged'],
    },
  },
  {
    id: 'quest-fearless-step',
    title: 'Fearless step',
    description: 'Name one action you would take if fear weren’t in the way.',
    type: 'reflection',
    estimatedMinutes: 2,
    payload: {
      type: 'reflection',
      prompt: 'If fear or self-doubt vanished for a moment, what is the very next step you would take?',
      minLength: 15,
    },
  },
  {
    id: 'quest-energy-source',
    title: 'What fuels you?',
    description: 'Choose the option that feels most restorative right now.',
    type: 'choice',
    estimatedMinutes: 1,
    payload: {
      type: 'choice',
      prompt: 'Which environment restores you faster when you feel stretched thin?',
      options: ['Focused solo time', 'Being with people who inspire me'],
    },
  },
];
