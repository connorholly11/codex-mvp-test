import { z } from 'zod';

const ISO_DATETIME_WITH_OFFSET_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const scheduleReminderArgsSchema = z.object({
  iso_datetime: z.string().regex(ISO_DATETIME_WITH_OFFSET_REGEX, {
    message: 'iso_datetime must include a timezone offset (e.g., 2025-06-01T15:00:00-07:00)',
  }),
  title: z.string().trim().min(1, { message: 'title is required' }).max(80),
  body: z.string().trim().min(1, { message: 'body is required' }).max(160),
});

const startTimerArgsSchema = z.object({
  duration_seconds: z
    .number({ coerce: true })
    .int({ message: 'duration_seconds must be an integer number of seconds' })
    .min(60, { message: 'duration_seconds must be at least 60 seconds' })
    .max(7200, { message: 'duration_seconds must be at most 7200 seconds' }),
  label: z
    .string()
    .trim()
    .min(1, { message: 'label cannot be empty' })
    .max(60, { message: 'label must be 60 characters or fewer' })
    .optional(),
});

const getLocationArgsSchema = z.object({
  granularity: z.literal('city', {
    errorMap: () => ({
      message: 'granularity must be "city" for get_location tool',
    }),
  }),
});

const saveNoteArgsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'title cannot be empty' })
    .max(80, { message: 'title must be 80 characters or fewer' })
    .optional(),
  body: z
    .string()
    .trim()
    .min(1, { message: 'body is required' })
    .max(500, { message: 'body must be 500 characters or fewer' }),
});

const createIcsEventArgsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'title is required' })
    .max(80, { message: 'title must be 80 characters or fewer' }),
  start_iso: z.string().regex(ISO_DATETIME_WITH_OFFSET_REGEX, {
    message: 'start_iso must include a timezone offset (e.g., 2025-06-01T15:00:00-07:00)',
  }),
  duration_minutes: z
    .number({ coerce: true })
    .int({ message: 'duration_minutes must be an integer' })
    .min(15, { message: 'duration_minutes must be at least 15' })
    .max(180, { message: 'duration_minutes must be at most 180' }),
  description: z
    .string()
    .trim()
    .min(1, { message: 'description cannot be empty' })
    .max(300, { message: 'description must be 300 characters or fewer' })
    .optional(),
});

export const toolManifest = {
  schedule_reminder: {
    summary: 'Schedule a one-off notification on the device.',
    argsSchema: scheduleReminderArgsSchema,
    consentKey: 'schedule_reminder',
    analyticsName: 'schedule_reminder',
    safeguards: ['Require ISO datetime with offset', 'Only one-off reminders in v2'],
  },
  start_timer: {
    summary: 'Start a countdown timer with a completion alert.',
    argsSchema: startTimerArgsSchema,
    consentKey: 'start_timer',
    analyticsName: 'start_timer',
    safeguards: ['Duration between 1 and 120 minutes', 'Runs locally only'],
  },
  get_location: {
    summary: "Request the user's coarse city and region.",
    argsSchema: getLocationArgsSchema,
    consentKey: 'get_location',
    analyticsName: 'get_location',
    safeguards: ['Explicit consent required', 'No precise coordinates stored'],
  },
  save_note: {
    summary: 'Persist a reflective note for the user.',
    argsSchema: saveNoteArgsSchema,
    consentKey: 'save_note',
    analyticsName: 'save_note',
    safeguards: ['Body limited to 500 characters'],
  },
  create_ics_event: {
    summary: 'Generate a downloadable calendar event (.ics).',
    argsSchema: createIcsEventArgsSchema,
    consentKey: 'create_ics_event',
    analyticsName: 'create_ics_event',
    safeguards: ['Duration capped at 3 hours', 'Manual add by user'],
  },
} as const;

export type ToolName = keyof typeof toolManifest;

export type ToolDefinition<Name extends ToolName = ToolName> = (typeof toolManifest)[Name];

export type ToolArgs<Name extends ToolName> = z.infer<ToolDefinition<Name>['argsSchema']>;

export type ToolManifest = typeof toolManifest;

export function safeParseToolArgs<Name extends ToolName>(
  name: Name,
  args: unknown,
): {
  valid: true;
  data: ToolArgs<Name>;
} | {
  valid: false;
  issues: string[];
} {
  const schema = toolManifest[name].argsSchema;
  const result = schema.safeParse(args);

  if (result.success) {
    return { valid: true, data: result.data };
  }

  return {
    valid: false,
    issues: result.error.issues.map((issue) => issue.message),
  };
}

export function assertToolArgs<Name extends ToolName>(name: Name, args: unknown): ToolArgs<Name> {
  const parsed = safeParseToolArgs(name, args);
  if (parsed.valid) {
    return parsed.data;
  }
  throw new Error(
    `Invalid args for tool "${name}": ${parsed.issues
      .map((issue) => `- ${issue}`)
      .join('\n')}`,
  );
}

export const toolNames: ToolName[] = Object.keys(toolManifest) as ToolName[];

export const ISO_DATE_REGEX = ISO_DATETIME_WITH_OFFSET_REGEX;
