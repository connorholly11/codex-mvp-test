import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedSupabase } from '@/lib/auth/get-authenticated-client';
import type { SupabaseDatabaseClient } from '@/lib/supabase/types';

const statusEnum = z.enum(['pending', 'scheduled', 'sent', 'dismissed']);

const updateSchema = z.object({
  id: z.string().uuid(),
  status: statusEnum,
  context: z.record(z.unknown()).optional(),
});

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = auth.client as SupabaseDatabaseClient;
  const user = auth.user;
  const params = request.nextUrl.searchParams;
  const statusFilter = params.get('status');

  const statuses = statusFilter
    ? statusFilter.split(',').map((value) => value.trim()).filter(Boolean)
    : ['pending'];

  const query = supabase
    .from('nudges')
    .select('id, kind, status, scheduled_for, payload, created_at, updated_at')
    .eq('user_id', user.id)
    .order('scheduled_for', { ascending: true });

  if (statuses.length > 0) {
    query.in('status', statuses);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch nudges', error);
    return NextResponse.json({ error: 'Unable to fetch nudges' }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = auth.client as SupabaseDatabaseClient;
  const user = auth.user;
  const { id, status, context } = parsed.data;

  const update = await supabase
    .from('nudges')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, kind, status, scheduled_for, payload, created_at, updated_at')
    .single();

  if (update.error) {
    if (update.error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Nudge not found' }, { status: 404 });
    }
    console.error('Failed to update nudge status', update.error);
    return NextResponse.json({ error: 'Failed to update nudge' }, { status: 500 });
  }

  if (context) {
    const logInsert = await supabase.from('actions_log').insert({
      user_id: user.id,
      action: `nudge_${status}`,
      payload: {
        nudge_id: id,
        ...context,
      },
    });

    if (logInsert.error) {
      console.warn('Failed to append actions log for nudge', logInsert.error);
    }
  }

  return NextResponse.json({ item: update.data });
}
