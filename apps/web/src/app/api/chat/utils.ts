import type { MessageParam, TextBlockParam } from '@anthropic-ai/sdk/resources/messages';
import { getSystemPrompt } from '@/lib/ai/system-prompt';
import type { SupabaseDatabaseClient } from '@/lib/supabase/types';
import type { AssistantToolCall } from '@purpose/api-client';
import { z } from 'zod';

export type Result<T> = { ok: true; data: T } | { ok: false; error: unknown };

function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

function err<T = never>(error: unknown): Result<T> {
  return { ok: false, error };
}

export async function ensureChatSession(
  supabase: SupabaseDatabaseClient,
  userId: string,
): Promise<Result<string>> {
  const chatSessionQuery = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (chatSessionQuery.error) {
    return err(chatSessionQuery.error);
  }

  let chatSessionId = chatSessionQuery.data?.id ?? null;

  if (!chatSessionId) {
    const inserted = await supabase
      .from('chat_sessions')
      .insert({ user_id: userId, title: 'Main conversation' })
      .select('id')
      .single();

    if (inserted.error) {
      return err(inserted.error);
    }

    chatSessionId = inserted.data.id;
  }

  return ok(chatSessionId);
}

export async function insertUserMessage(
  supabase: SupabaseDatabaseClient,
  userId: string,
  chatSessionId: string,
  content: string,
): Promise<Result<{ id: string; createdAt: string }>> {
  const userMessageInsert = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      session_id: chatSessionId,
      role: 'user',
      content,
    })
    .select('id, created_at')
    .single();

  if (userMessageInsert.error) {
    return err(userMessageInsert.error);
  }

  return ok({
    id: userMessageInsert.data.id,
    createdAt: userMessageInsert.data.created_at,
  });
}

export async function fetchPersonalInsightsSummary(
  supabase: SupabaseDatabaseClient,
  userId: string,
): Promise<Result<string>> {
  const reportQuery = await supabase
    .from('reports')
    .select('content')
    .eq('user_id', userId)
    .eq('report_type', 'personal-insights')
    .maybeSingle();

  if (reportQuery.error) {
    return err(reportQuery.error);
  }

  return ok(buildInsightsSummary(reportQuery.data?.content));
}

export type ChatHistoryRecord = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function fetchChatHistory(
  supabase: SupabaseDatabaseClient,
  chatSessionId: string,
  limit = 20,
): Promise<Result<ChatHistoryRecord[]>> {
  const historyQuery = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', chatSessionId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (historyQuery.error) {
    return err(historyQuery.error);
  }

  return ok((historyQuery.data ?? []) as ChatHistoryRecord[]);
}

export function toAnthropicMessages(history: ChatHistoryRecord[]): MessageParam[] {
  return history.map((message) => ({
    role: message.role === 'user' ? 'user' : 'assistant',
    content: [{ type: 'text', text: message.content } as TextBlockParam],
  }));
}

type ReportContent = {
  openingInsight: string;
  sections: { title: string; content: string }[];
};

export function buildSystemPrompt(insights: string): string {
  const basePrompt = getSystemPrompt();
  const insightsBlock = insights
    ? `Here are personal insights about the user to guide your coaching:\n${insights}`
    : 'The user has not completed their personal insights report yet.';

  return `${basePrompt}\n\n${insightsBlock}`;
}

export function buildInsightsSummary(content: unknown): string {
  if (!content || typeof content !== 'object') {
    return '';
  }

  const report = content as ReportContent;
  const sectionSummaries = report.sections
    .map((section) => `${section.title}: ${section.content}`)
    .join('\n');

  return `Opening insight: ${report.openingInsight}\n${sectionSummaries}`;
}

const TOOL_BLOCK_REGEX = /```tool\s*\n([\s\S]*?)```/i;

const scheduleReminderArgsSchema = z.object({
  iso_datetime: z.string().min(10),
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(160),
});

const getLocationArgsSchema = z.object({
  granularity: z.literal('city'),
});

const toolCallSchema = z.object({
  name: z.string(),
  args: z.unknown(),
});

type ExtractToolCallResult = {
  cleanedText: string;
  toolCall: AssistantToolCall | null;
};

export function extractToolCallFromMessage(message: string): ExtractToolCallResult {
  const match = TOOL_BLOCK_REGEX.exec(message);
  if (!match) {
    return { cleanedText: message.trim(), toolCall: null };
  }

  const rawJson = match[1].trim();
  const textWithoutBlock = `${message.slice(0, match.index)}${message.slice(match.index + match[0].length)}`.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      cleanedText: textWithoutBlock,
      toolCall: {
        name: 'invalid',
        args: rawJson,
        validation: {
          valid: false,
          issues: ['Invalid JSON in tool block'],
        },
      },
    };
  }

  const baseParse = toolCallSchema.safeParse(parsed);
  if (!baseParse.success || typeof baseParse.data.name !== 'string') {
    return {
      cleanedText: textWithoutBlock,
      toolCall: {
        name: 'invalid',
        args: parsed,
        validation: {
          valid: false,
          issues: ['Tool block must include a string "name" field.'],
        },
      },
    };
  }

  const name = baseParse.data.name;
  const args = (baseParse.data as { args: unknown }).args;

  if (name === 'schedule_reminder') {
    const result = scheduleReminderArgsSchema.safeParse(args);
    if (result.success) {
      return {
        cleanedText: textWithoutBlock,
        toolCall: {
          name: 'schedule_reminder',
          args: result.data,
          validation: { valid: true },
        },
      };
    }

    return {
      cleanedText: textWithoutBlock,
      toolCall: {
        name,
        args,
        validation: {
          valid: false,
          issues: result.error.errors.map((err) => err.message),
        },
      },
    };
  }

  if (name === 'get_location') {
    const result = getLocationArgsSchema.safeParse(args);
    if (result.success) {
      return {
        cleanedText: textWithoutBlock,
        toolCall: {
          name: 'get_location',
          args: result.data,
          validation: { valid: true },
        },
      };
    }

    return {
      cleanedText: textWithoutBlock,
      toolCall: {
        name,
        args,
        validation: {
          valid: false,
          issues: result.error.errors.map((err) => err.message),
        },
      },
    };
  }

  return {
    cleanedText: textWithoutBlock,
    toolCall: {
      name,
      args,
      validation: {
        valid: false,
        issues: [`Unsupported tool name "${name}".`],
      },
    },
  };
}
