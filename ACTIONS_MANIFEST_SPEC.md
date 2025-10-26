# Tool Bridge v2 - Actions Manifest Specification

The **Actions Manifest** is the single source of truth for every assistant-accessible tool. It powers prompt instructions, server-side validation, and client-side typing. This spec captures the contract so both server and mobile can stay in sync without hand-written duplication.

## Manifest Structure

```ts
type ToolName =
  | "schedule_reminder"
  | "start_timer"
  | "get_location"
  | "save_note"
  | "create_ics_event";

type ToolDefinition = {
  summary: string;
  argsSchema: ZodSchema;
  consentKey: string;
  analyticsName: string;
  safeguards: string[];
};

type ToolManifest = Record<ToolName, ToolDefinition>;
```

- **summary** - short human description reused in settings/debug UI.
- **argsSchema** - shared Zod schema that enforces validation in both the server parser and mobile Tool Bridge.
- **consentKey** - matches entries in `TOOL_CONSENT_COPY.md`.
- **analyticsName** - sent with `chat_tool_*` analytics events.
- **safeguards** - textual reminders surfaced in QA tools (e.g., "Max duration 120 minutes").

The manifest lives in `packages/api-client/src/tool-manifest.ts` so web, mobile, and the server can import it without cross-package duplication.

## Tool Definitions

### schedule_reminder

- **summary:** "Schedule a one-off notification on the device."
- **Schema:**
  ```ts
  z.object({
    iso_datetime: z.string().regex(ISO_DATETIME_WITH_OFFSET_REGEX),
    title: z.string().trim().min(1).max(80),
    body: z.string().trim().min(1).max(160),
  })
  ```
- **Safeguards:** between now+2 minutes and now+30 days; no recurring reminders in v2.

### start_timer

- **summary:** "Start a countdown timer with a completion alert."
- **Schema:**
  ```ts
  z.object({
    duration_seconds: z.number().int().min(60).max(7200),
    label: z.string().trim().min(1).max(60).optional(),
  })
  ```
- **Safeguards:** timers fire locally only; no background refresh guarantees beyond OS.

### get_location

- **summary:** "Ask for the user's coarse city + region."
- **Schema:** `z.object({ granularity: z.literal("city") })`
- **Safeguards:** explicit consent; never store precise coordinates.

### save_note

- **summary:** "Persist a reflective note locally (with optional sync)."
- **Schema:**
  ```ts
  z.object({
    title: z.string().trim().min(1).max(80).optional(),
    body: z.string().trim().min(1).max(500),
  })
  ```
- **Safeguards:** no system prompts or PII allowed in default note templates.

### create_ics_event

- **summary:** "Generate a downloadable calendar event."
- **Schema:**
  ```ts
  z.object({
    title: z.string().trim().min(1).max(80),
    start_iso: z.string().regex(ISO_DATETIME_WITH_OFFSET_REGEX),
    duration_minutes: z.number().int().min(15).max(180),
    description: z.string().trim().min(1).max(300).optional(),
  })
  ```
- **Safeguards:** ICS exported locally; no automatic calendar writes.

## Validation Helpers

The manifest exports helper utilities:

- `safeParseToolCall(name: ToolName, args: unknown)` → `{ success, data | issues[] }`
- `assertToolCall` which throws on invalid input (used in tests).
- `toolSummaries` and `toolConsentKeys` for UI surfaces.

## Backward Compatibility

- Manifest entries must only be **added**. Removing or renaming tools requires a migration and prompt update.
- Schema loosening is allowed (e.g., increasing string length). Tightening constraints must be feature-flagged.
- All consumers must bump their prompt/tooling version together during release (feature flag: `CHAT_ENABLE_TOOL_CALLS`).
