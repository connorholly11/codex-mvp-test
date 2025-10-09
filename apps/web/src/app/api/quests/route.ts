import { NextRequest, NextResponse } from 'next/server';
import { QUESTS } from '@/features/quests/data/quests';
import type { QuestResponse, QuestStatus } from '@/features/quests/types';
import type { SupabaseDatabaseClient } from '@/lib/supabase/types';
import { getAuthenticatedSupabase } from '@/lib/auth/get-authenticated-client';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = auth.client as SupabaseDatabaseClient;
  const user = auth.user;

  const progressQuery = await supabase
    .from('quests_progress')
    .select('quest_id, status, answer, completed_at')
    .eq('user_id', user.id);

  if (progressQuery.error) {
    console.error('Failed to fetch quest progress', progressQuery.error);
    return NextResponse.json({ error: 'Failed to fetch quests' }, { status: 500 });
  }

  const statuses: Record<string, QuestStatus> = Object.fromEntries(
    QUESTS.map((quest) => [quest.id, 'available' as QuestStatus]),
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
