import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSupabase } from '@/lib/auth/get-authenticated-client';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = auth.client;
  const user = auth.user;
  const chatSession = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  let chatSessionId = chatSession.data?.id ?? null;

  if (!chatSessionId) {
    const inserted = await supabase
      .from('chat_sessions')
      .insert({ user_id: user.id, title: 'Main conversation' })
      .select('id')
      .single();

    if (inserted.error) {
      console.error('Failed to create chat session', inserted.error);
      return NextResponse.json({ error: 'Failed to initialize chat session' }, { status: 500 });
    }

    chatSessionId = inserted.data.id;
  }

  const messagesQuery = await supabase
    .from('chat_messages')
    .select('id, role, content, metadata, created_at')
    .eq('session_id', chatSessionId)
    .order('created_at', { ascending: true });

  if (messagesQuery.error) {
    console.error('Failed to fetch chat history', messagesQuery.error);
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }

  const reportQuery = await supabase
    .from('reports')
    .select('report_type, title, content, generated_at')
    .eq('user_id', user.id)
    .eq('report_type', 'personal-insights')
    .maybeSingle();

  const profileQuery = await supabase
    .from('profiles')
    .select('display_name, legal_acceptance_at, onboarding_completed_at')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({
    chatSessionId,
    messages: messagesQuery.data?.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      metadata: message.metadata,
      createdAt: message.created_at,
    })) ?? [],
    report: reportQuery.data ?? null,
    profile: profileQuery.data ?? null,
  });
}
