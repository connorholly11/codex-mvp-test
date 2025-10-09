import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Message, MessageParam, TextBlockParam } from '@anthropic-ai/sdk/resources/messages';
import type { SupabaseDatabaseClient } from '@/lib/supabase/types';
import { z } from 'zod';
import { getAuthenticatedSupabase } from '@/lib/auth/get-authenticated-client';
import { getSystemPrompt } from '@/lib/ai/system-prompt';

const requestSchema = z.object({
  message: z.string().min(1).max(4000),
});

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedSupabase(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = auth.client as SupabaseDatabaseClient;
  const user = auth.user;
  const payload = await request.json();
  const parsed = requestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const userMessage = parsed.data.message.trim();
  const userId = user.id;

  const chatSessionQuery = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  let chatSessionId = chatSessionQuery.data?.id ?? null;

  if (!chatSessionId) {
    const inserted = await supabase
      .from('chat_sessions')
      .insert({ user_id: userId, title: 'Main conversation' })
      .select('id')
      .single();

    if (inserted.error) {
      console.error('Failed to create chat session', inserted.error);
      return NextResponse.json({ error: 'Failed to create chat session' }, { status: 500 });
    }

    chatSessionId = inserted.data.id;
  }

  const userMessageInsert = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      session_id: chatSessionId,
      role: 'user',
      content: userMessage,
    })
    .select('id, created_at')
    .single();

  if (userMessageInsert.error) {
    console.error('Failed to persist user message', userMessageInsert.error);
    return NextResponse.json({ error: 'Failed to store message' }, { status: 500 });
  }

  const reportQuery = await supabase
    .from('reports')
    .select('content')
    .eq('user_id', userId)
    .eq('report_type', 'personal-insights')
    .maybeSingle();

  const insightsSummary = buildInsightsSummary(reportQuery.data?.content);

  const historyQuery = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', chatSessionId)
    .order('created_at', { ascending: true })
    .limit(20);

  if (historyQuery.error) {
    console.error('Failed to fetch chat history for context', historyQuery.error);
    return NextResponse.json({ error: 'Failed to load context' }, { status: 500 });
  }

  const model = process.env.ANTHROPIC_MODEL_NAME ?? 'claude-3-5-sonnet-20241022';
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Anthropic API key is not configured' }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });
  const systemPrompt = buildSystemPrompt(insightsSummary);
  const agentMessages: MessageParam[] = (historyQuery.data ?? []).map((message) => ({
    role: message.role === 'user' ? 'user' : 'assistant',
    content: [{ type: 'text', text: message.content } as TextBlockParam],
  }));

  let assistantMessage = '';

  try {
    const completion: Message = await anthropic.messages.create({
      model,
      max_tokens: 800,
      temperature: 0.6,
      system: systemPrompt,
      messages: agentMessages,
    });

    assistantMessage = extractTextFromCompletion(completion);
  } catch (error) {
    console.error('Anthropic completion failed', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }

  if (!assistantMessage) {
    assistantMessage = 'I had trouble formulating a response. Could you try again?';
  }

  const assistantInsert = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      session_id: chatSessionId,
      role: 'assistant',
      content: assistantMessage.trim(),
      metadata: {
        model,
      },
    })
    .select('id, created_at, content, metadata')
    .single();

  if (assistantInsert.error) {
    console.error('Failed to persist assistant message', assistantInsert.error);
    return NextResponse.json({ error: 'Failed to store assistant message' }, { status: 500 });
  }

  await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', chatSessionId);

  return NextResponse.json({
    userMessage: {
      id: userMessageInsert.data.id,
      createdAt: userMessageInsert.data.created_at,
    },
    assistantMessage: {
      id: assistantInsert.data.id,
      createdAt: assistantInsert.data.created_at,
      content: assistantInsert.data.content,
      metadata: assistantInsert.data.metadata,
    },
  });
}

type ReportContent = {
  openingInsight: string;
  sections: { title: string; content: string }[];
};

function extractTextFromCompletion(completion: Message): string {
  for (const block of completion.content ?? []) {
    if (block.type === 'text' && typeof block.text === 'string') {
      return block.text;
    }
  }
  return '';
}

function buildInsightsSummary(content: unknown): string {
  if (!content || typeof content !== 'object') {
    return '';
  }

  const report = content as ReportContent;
  const sectionSummaries = report.sections
    .map((section) => `${section.title}: ${section.content}`)
    .join('\n');

  return `Opening insight: ${report.openingInsight}\n${sectionSummaries}`;
}

function buildSystemPrompt(insights: string): string {
  const basePrompt = getSystemPrompt();
  const insightsBlock = insights
    ? `Here are personal insights about the user to guide your coaching:\n${insights}`
    : 'The user has not completed their personal insights report yet.';

  return `${basePrompt}\n\n${insightsBlock}`;
}
