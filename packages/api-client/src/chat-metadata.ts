export type ScheduleReminderToolCall = {
  name: 'schedule_reminder';
  args: {
    iso_datetime: string;
    title: string;
    body: string;
  };
  validation: {
    valid: true;
  };
  result?: ToolCallResult;
};

export type GetLocationToolCall = {
  name: 'get_location';
  args: {
    granularity: 'city';
  };
  validation: {
    valid: true;
  };
  result?: ToolCallResult;
};

export type InvalidToolCall = {
  name: string;
  args: unknown;
  validation: {
    valid: false;
    issues?: string[];
  };
  result?: ToolCallResult;
};

export type AssistantToolCall = ScheduleReminderToolCall | GetLocationToolCall | InvalidToolCall;

export type ToolCallResult = {
  status: 'confirmed' | 'dismissed';
  timestamp: string;
  context?: Record<string, unknown>;
};

export type AssistantMessageMetadata = {
  model?: string;
  tool_call?: AssistantToolCall | null;
} & Record<string, unknown>;
