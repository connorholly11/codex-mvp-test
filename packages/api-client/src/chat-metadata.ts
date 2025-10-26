import { toolManifest, toolNames, safeParseToolArgs, type ToolName, type ToolArgs } from './tool-manifest';

export type ToolCallResult = {
  status: 'confirmed' | 'dismissed';
  timestamp: string;
  context?: Record<string, unknown>;
};

type ValidToolCall<Name extends ToolName> = {
  name: Name;
  args: ToolArgs<Name>;
  validation: {
    valid: true;
  };
  result?: ToolCallResult;
};

export type ScheduleReminderToolCall = ValidToolCall<'schedule_reminder'>;
export type StartTimerToolCall = ValidToolCall<'start_timer'>;
export type GetLocationToolCall = ValidToolCall<'get_location'>;
export type SaveNoteToolCall = ValidToolCall<'save_note'>;
export type CreateIcsEventToolCall = ValidToolCall<'create_ics_event'>;

export type InvalidToolCall = {
  name: string;
  args: unknown;
  validation: {
    valid: false;
    issues?: string[];
  };
  result?: ToolCallResult;
};

export type AssistantToolCall =
  | ScheduleReminderToolCall
  | StartTimerToolCall
  | GetLocationToolCall
  | SaveNoteToolCall
  | CreateIcsEventToolCall
  | InvalidToolCall;

export type AssistantMessageMetadata = {
  model?: string;
  tool_call?: AssistantToolCall | null;
} & Record<string, unknown>;

function normalizeToolCallResult(result: unknown): ToolCallResult | undefined {
  if (!result || typeof result !== 'object') {
    return undefined;
  }

  const { status, timestamp, context } = result as {
    status?: unknown;
    timestamp?: unknown;
    context?: unknown;
  };

  if (status !== 'confirmed' && status !== 'dismissed') {
    return undefined;
  }

  if (typeof timestamp !== 'string' || timestamp.length === 0) {
    return undefined;
  }

  return {
    status,
    timestamp,
    context: typeof context === 'object' && context !== null ? (context as Record<string, unknown>) : undefined,
  };
}

function normalizeInvalidToolCall(name: string | null, args: unknown, issues: string[]): InvalidToolCall {
  return {
    name: name ?? 'invalid',
    args,
    validation: {
      valid: false,
      issues,
    },
  };
}

export function normalizeToolCall(raw: unknown): AssistantToolCall | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const name = (raw as { name?: unknown }).name;
  const args = (raw as { args?: unknown }).args;
  const result = normalizeToolCallResult((raw as { result?: unknown }).result);

  if (typeof name !== 'string') {
    return {
      ...normalizeInvalidToolCall('invalid', args, ['Tool block must provide a string "name" field.']),
      result,
    };
  }

  if (!toolNames.includes(name as ToolName)) {
    return {
      ...normalizeInvalidToolCall(name, args, [`Unsupported tool name "${name}".`]),
      result,
    };
  }

  const parsed = safeParseToolArgs(name as ToolName, args);
  if (!parsed.valid) {
    return {
      ...normalizeInvalidToolCall(name, args, parsed.issues),
      result,
    };
  }

  return {
    name: name as ToolName,
    args: parsed.data,
    validation: {
      valid: true,
    },
    result,
  } as AssistantToolCall;
}

export function normalizeAssistantMetadata(metadata: unknown): AssistantMessageMetadata | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const typed = metadata as Record<string, unknown>;
  const normalizedToolCall = normalizeToolCall(typed.tool_call);

  return {
    ...typed,
    tool_call: normalizedToolCall,
  };
}

export const manifestSummaries = Object.fromEntries(
  toolNames.map((name) => [name, toolManifest[name].summary]),
) as Record<ToolName, string>;

export const manifestConsentKeys = Object.fromEntries(
  toolNames.map((name) => [name, toolManifest[name].consentKey]),
) as Record<ToolName, string>;
