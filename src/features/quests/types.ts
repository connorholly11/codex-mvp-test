export type QuestType = 'likert' | 'reflection' | 'choice';

export type QuestDefinition = {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  estimatedMinutes: number;
  payload:
    | {
        type: 'likert';
        prompt: string;
        scaleLabels: [string, string];
      }
    | {
        type: 'reflection';
        prompt: string;
        minLength: number;
      }
    | {
        type: 'choice';
        prompt: string;
        options: [string, string];
      };
};

export type QuestStatus = 'available' | 'completed';

export type QuestResponse = {
  questId: string;
  completedAt: string;
  answer: string | number;
};
