import { NextRequest, NextResponse } from 'next/server';
import { onboardingPayloadSchema } from '@purpose/api-client/onboarding';
import type { SupabaseDatabaseClient } from '@/lib/supabase/types';
import { buildPersonalInsightsReport, generatePersonalInsights } from '@/lib/reports';
import { getAuthenticatedSupabase } from '@/lib/auth/get-authenticated-client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = auth.client as SupabaseDatabaseClient;
  const sessionUser = auth.user;
  const body = await request.json();
  const parsed = onboardingPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { onboarding, profile } = parsed.data;
  const now = new Date().toISOString();

  const profileEmail = sessionUser.email;
  if (!profileEmail) {
    return NextResponse.json({ error: 'Email missing from session' }, { status: 400 });
  }

  const upsertProfile = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: sessionUser.id,
        email: profileEmail,
        display_name: profile.displayName,
        legal_acceptance_at: profile.legalAcceptedAt ?? now,
        onboarding_completed_at: now,
      },
      { onConflict: 'user_id' },
    )
    .select('user_id')
    .single();

  if (upsertProfile.error) {
    console.error('Failed to upsert profile', upsertProfile.error);
    return NextResponse.json({ error: 'Failed to store profile' }, { status: 500 });
  }

  const assessmentInsert = await supabase.from('assessments').insert({
    user_id: sessionUser.id,
    payload: onboarding,
    completed_at: now,
  });

  if (assessmentInsert.error) {
    console.error('Failed to persist assessment', assessmentInsert.error);
    return NextResponse.json({ error: 'Failed to save assessment' }, { status: 500 });
  }

  const report = buildPersonalInsightsReport(onboarding);

  const reportUpsert = await supabase
    .from('reports')
    .upsert(
      {
        user_id: sessionUser.id,
        report_type: 'personal-insights',
        title: report.title,
        content: report,
        generated_at: now,
      },
      { onConflict: 'user_id,report_type' },
    )
    .select('id')
    .single();

  if (reportUpsert.error) {
    console.error('Failed to upsert report', reportUpsert.error);
    return NextResponse.json({ error: 'Failed to store report' }, { status: 500 });
  }

  const existingSession = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', sessionUser.id)
    .limit(1)
    .maybeSingle();

  let chatSessionId = existingSession.data?.id ?? null;

  if (!chatSessionId) {
    const inserted = await supabase
      .from('chat_sessions')
      .insert({
        user_id: sessionUser.id,
        title: 'Main conversation',
      })
      .select('id')
      .single();

    if (inserted.error) {
      console.error('Failed to create chat session', inserted.error);
      return NextResponse.json({ error: 'Failed to initialize chat session' }, { status: 500 });
    }

    chatSessionId = inserted.data.id;
  }

  const existingMessageCount = await supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', chatSessionId);

  if ((existingMessageCount.count ?? 0) === 0) {
    const summary = generatePersonalInsights(onboarding);
    const displayName = profile.displayName ?? (sessionUser.user_metadata?.full_name as string | null) ?? 'there';

    const greeting = `Hey ${displayName}, I’m Fermi. I’ve reviewed your assessment and I’m ready to help you focus on ${
      summary.topValueLabel?.toLowerCase() ?? 'what matters most to you'
    } while making progress where it feels toughest.`;

    const baseMessages = buildInitialReportMessages(report, chatSessionId, sessionUser.id);
    baseMessages.unshift({
      user_id: sessionUser.id,
      session_id: chatSessionId,
      role: 'assistant' as const,
      content: greeting,
      metadata: { type: 'greeting' },
    });

    const introInsert = await supabase.from('chat_messages').insert(baseMessages);

    if (introInsert.error) {
      console.error('Failed to seed initial chat messages', introInsert.error);
    }
  }

  return NextResponse.json({
    success: true,
    report,
    chatSessionId,
  });
}

function buildInitialReportMessages(
  report: ReturnType<typeof buildPersonalInsightsReport>,
  sessionId: string,
  userId: string,
) {
  const intro = {
    user_id: userId,
    session_id: sessionId,
    role: 'assistant' as const,
    content:
      'Here’s the personalised report I created for you. I’ll keep referencing these highlights as we work together.',
    metadata: { type: 'report-intro', reportId: 'personal-insights' },
  };

  const sections = report.sections.map((section, index) => ({
    user_id: userId,
    session_id: sessionId,
    role: 'assistant' as const,
    content: `${section.title}:\n${section.content.replace(/\*\*/g, '')}`,
    metadata: {
      type: 'report-section',
      reportId: 'personal-insights',
      sectionId: section.id,
      order: index,
    },
  }));

  const cta = {
    user_id: userId,
    session_id: sessionId,
    role: 'assistant' as const,
    content: 'You can open the full Personal Insights report anytime from the card above or the Reports section.',
    metadata: { type: 'report-cta' },
  };

  return [intro, ...sections, cta];
}
