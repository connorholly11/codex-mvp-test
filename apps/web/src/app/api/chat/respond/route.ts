import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Message, MessageParam } from '@anthropic-ai/sdk/resources/messages';
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
  const systemPrompt = buildSystemPrompt(insightsResult.data);
  const agentMessages: MessageParam[] = toAnthropicMessages(historyResult.data);

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

  const trimmedAssistantMessage = assistantMessage.trim();
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
      session_id: chatSessionId,
      role: 'assistant',
      content: finalContent,
      metadata: metadataPayload,
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
      id: userMessageResult.data.id,
      createdAt: userMessageResult.data.createdAt,
    },
    assistantMessage: {
      id: assistantInsert.data.id,
      createdAt: assistantInsert.data.created_at,
      content: assistantInsert.data.content,
      metadata: assistantInsert.data.metadata,
    },
  });
}
function extractTextFromCompletion(completion: Message): string {
  for (const block of completion.content ?? []) {
    if (block.type === 'text' && typeof block.text === 'string') {
      return block.text;
    }
  }
  return '';
}
