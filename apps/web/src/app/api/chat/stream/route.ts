import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, TextBlockParam } from '@anthropic-ai/sdk/resources/messages';
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

  const encoder = new TextEncoder();
  const agentMessages: MessageParam[] = (historyQuery.data ?? []).map((message) => ({
    role: message.role === 'user' ? 'user' : 'assistant',
    content: [{ type: 'text', text: message.content } as TextBlockParam],
  }));

  const userAckPayload = {
    userMessageId: userMessageInsert.data.id,
    createdAt: userMessageInsert.data.created_at,
  };

  const systemPrompt = buildSystemPrompt(insightsSummary);

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(new Error('Chat response exceeded 30 seconds'));
  }, 29000);

  let assistantMessage = '';
  let streamFinished = false;
  let streamAborted = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`event: heartbeat\ndata: {}\n\n`));
      }, 15000);

      controller.enqueue(
        encoder.encode(`event: ack\ndata: ${JSON.stringify(userAckPayload)}\n\n`),
      );

      let assistantRecordId: string | null = null;
      let assistantRecordCreatedAt: string | null = null;
      let assistantRecordMetadata: Record<string, unknown> | null = null;

      try {
        const completion = await anthropic.messages.create(
          {
            model,
            max_tokens: 800,
            temperature: 0.6,
            system: systemPrompt,
            messages: agentMessages,
            stream: true,
          },
          { signal: abortController.signal },
        );

        for await (const event of completion) {
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            const token = event.delta.text ?? '';
            assistantMessage += token;
            controller.enqueue(
              encoder.encode(
                `event: token\ndata: ${JSON.stringify({ token })}\n\n`,
              ),
            );
          }

          if (event.type === 'message_delta' && event.delta?.stop_reason) {
            streamFinished = true;
            controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
          }
        }
      } catch (error) {
        streamAborted = error instanceof Error && error.name === 'AbortError';
        const message = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ message })}\n\n`),
        );
      } finally {
        clearTimeout(timeoutId);
        clearInterval(heartbeat);

        if (!streamFinished && !streamAborted) {
          controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
        }

        if (assistantMessage.trim().length > 0) {
          const assistantInsert = await supabase
            .from('chat_messages')
            .insert({
              user_id: userId,
              session_id: chatSessionId!,
              role: 'assistant',
              content: assistantMessage.trim(),
              metadata: {
                model,
              },
            })
            .select('id, created_at, metadata')
            .single();

          if (assistantInsert.error) {
            console.error('Failed to persist assistant message', assistantInsert.error);
          } else {
            assistantRecordId = assistantInsert.data.id;
            assistantRecordCreatedAt = assistantInsert.data.created_at;
            assistantRecordMetadata =
              (assistantInsert.data.metadata as Record<string, unknown> | null) ?? null;

            await supabase
              .from('chat_sessions')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', chatSessionId!);
          }
        }

        if (assistantRecordId) {
          controller.enqueue(
            encoder.encode(
              `event: final\ndata: ${JSON.stringify({
                assistantMessageId: assistantRecordId,
                createdAt: assistantRecordCreatedAt,
                metadata: assistantRecordMetadata,
              })}\n\n`,
            ),
          );
        }

        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

type ReportContent = {
  openingInsight: string;
  sections: { title: string; content: string }[];
};

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
