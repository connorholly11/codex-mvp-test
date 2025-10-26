import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import type { SupabaseDatabaseClient } from '@/lib/supabase/types';
import { z } from 'zod';
import { getAuthenticatedSupabase } from '@/lib/auth/get-authenticated-client';
import {
  buildSystemPrompt,
  ensureChatSession,
  extractToolCallFromMessage,
  fetchChatHistory,
  fetchPersonalInsightsSummary,
  insertUserMessage,
  toAnthropicMessages,
} from '../utils';

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

  const sessionResult = await ensureChatSession(supabase, userId);
  if (!sessionResult.ok) {
    console.error('Failed to create chat session', sessionResult.error);
    return NextResponse.json({ error: 'Failed to create chat session' }, { status: 500 });
  }

  const chatSessionId = sessionResult.data;

  const userMessageResult = await insertUserMessage(supabase, userId, chatSessionId, userMessage);
  if (!userMessageResult.ok) {
    console.error('Failed to persist user message', userMessageResult.error);
    return NextResponse.json({ error: 'Failed to store message' }, { status: 500 });
  }

  const insightsResult = await fetchPersonalInsightsSummary(supabase, userId);
  if (!insightsResult.ok) {
    console.error('Failed to fetch personal insights summary', insightsResult.error);
    return NextResponse.json({ error: 'Failed to load context' }, { status: 500 });
  }

  const historyResult = await fetchChatHistory(supabase, chatSessionId);
  if (!historyResult.ok) {
    console.error('Failed to fetch chat history for context', historyResult.error);
    return NextResponse.json({ error: 'Failed to load context' }, { status: 500 });
  }

  const model = process.env.ANTHROPIC_MODEL_NAME ?? 'claude-3-5-sonnet-20241022';
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Anthropic API key is not configured' }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });

  const encoder = new TextEncoder();
  const agentMessages: MessageParam[] = toAnthropicMessages(historyResult.data);

  const userAckPayload = {
    userMessageId: userMessageResult.data.id,
    createdAt: userMessageResult.data.createdAt,
  };

  const systemPrompt = buildSystemPrompt(insightsResult.data);

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(new Error('Chat response exceeded 30 seconds'));
  }, 29000);

  let assistantMessage = '';
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
            // Completion received; remaining cleanup handled after persistence.
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

        const trimmedAssistantMessage = assistantMessage.trim();

        if (trimmedAssistantMessage.length > 0) {
          const { cleanedText, toolCall } = extractToolCallFromMessage(trimmedAssistantMessage);
          const finalContent = cleanedText.length > 0 ? cleanedText : trimmedAssistantMessage;
          const metadataPayload: Record<string, unknown> = {
            model,
            ...(toolCall ? { tool_call: toolCall } : {}),
          };

          if (toolCall && toolCall.validation?.valid === false) {
            console.warn('Tool call validation failed', {
              issues: toolCall.validation.issues,
              name: toolCall.name,
            });
          }

          const assistantInsert = await supabase
            .from('chat_messages')
            .insert({
              user_id: userId,
              session_id: chatSessionId!,
              role: 'assistant',
              content: finalContent,
              metadata: metadataPayload,
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

        if (!streamAborted) {
          controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
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
