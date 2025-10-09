import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { QUESTS } from '@/features/quests/data/quests';
import type { QuestResponse, QuestStatus } from '@/features/quests/types';
import { getAuthenticatedSupabase } from '@/lib/auth/get-authenticated-client';

const payloadSchema = z.object({
  answer: z.union([z.string(), z.number()]),
});

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { questId: string } }) {
  const auth = await getAuthenticatedSupabase(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const questId = params.questId;
  const quest = QUESTS.find((item) => item.id === questId);
  if (!quest) {
    return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
  }

  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = auth.client;
  const user = auth.user;
  const now = new Date().toISOString();

  const upsert = await supabase
    .from('quests_progress')
    .upsert(
      {
        user_id: user.id,
        quest_id: questId,
        status: 'completed',
        answer: parsed.data.answer,
        started_at: now,
        completed_at: now,
      },
      { onConflict: 'user_id,quest_id' },
    )
    .select('quest_id');

  if (upsert.error) {
    console.error('Failed to upsert quest progress', upsert.error);
    return NextResponse.json({ error: 'Failed to save quest' }, { status: 500 });
  }

  const progressQuery = await supabase
    .from('quests_progress')
    .select('quest_id, status, answer, completed_at')
    .eq('user_id', user.id);

  if (progressQuery.error) {
    console.error('Failed to refetch quest progress', progressQuery.error);
    return NextResponse.json({ error: 'Failed to load quests' }, { status: 500 });
  }

  const statuses: Record<string, QuestStatus> = Object.fromEntries(
    QUESTS.map((item) => [item.id, 'available' as QuestStatus]),
  );
  const responses: QuestResponse[] = [];

  for (const record of progressQuery.data ?? []) {
    statuses[record.quest_id] = record.status as QuestStatus;
    if (record.completed_at) {
      responses.push({
        questId: record.quest_id,
        answer: record.answer ?? null,
        completedAt: record.completed_at,
      });
    }
  }

  return NextResponse.json({ statuses, responses });
}
