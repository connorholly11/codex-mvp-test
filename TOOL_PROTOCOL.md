# Tool Bridge v2 — Tool-Call Protocol

This document defines the contract between the assistant, the server stream parser, and Purpose clients for Tool Bridge v2. It applies to any surface that renders assistant replies (mobile, web, future clients) and must be treated as a backwards compatible interface.

## Overview

1. The assistant may embed **one fenced tool block** inside its natural-language reply when it wants to propose a device action.
2. The server parser removes the block, validates it against the manifest, and surfaces the result as `chat_messages.metadata.tool_call`.
3. Clients render the proposal, collect user consent, execute the tool locally if approved, and post a follow-up message.

## Fenced Tool Block

````text
<assistant prose introducing the idea>
```tool
{
  "name": "<tool_name>",
  "args": { ... }
}
```
<assistant prose inviting confirmation>
````

- The fence header **must be exactly** ```tool (all lowercase).
- The JSON object must contain a `name` string and an `args` object.
- Only **one** fenced block is allowed per assistant turn. Additional blocks must be ignored by the parser.
- The assistant must always include user-facing prose before and after the block so clients have copy to display even when tooling is disabled.

## Shared Validation Rules

| Rule | Description |
| ---- | ----------- |
| JSON encoding | UTF-8, no trailing commas, strict JSON. |
| Unknown fields | Tool manifests may reject unknown args; clients should include them in validation feedback. |
| ISO datetimes | All datetimes must include timezone offset (`YYYY-MM-DDTHH:mm:ss±HH:MM`). |
| Length guards | Strings have explicit max lengths noted per tool; the assistant prompt enforces them. |
| Privacy | No tool argument may contain unredacted PII beyond what the user typed in the chat turn. |

The parser returns `{valid:false, issues:[...errors...]}` when validation fails so clients can present a graceful fallback.

## Supported Tools

### `schedule_reminder`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `iso_datetime` | string | Required. ISO-8601 with offset. Must be between now+2 min and now+30 days. |
| `title` | string | Required. ≤ 80 chars. |
| `body` | string | Required. ≤ 160 chars. |

Purpose: Schedule a one-off device notification via Expo Notifications.

### `start_timer`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `duration_seconds` | integer | Required. Between 60 and 7200 seconds. |
| `label` | string | Optional. ≤ 60 chars. |

Purpose: Start an on-device countdown timer with local notifications.

### `get_location`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `granularity` | string | Required. Must be `"city"`. |

Purpose: Request coarse location (city + region) after explicit consent. Clients must not send coordinates to the server.

### `save_note`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `title` | string | Optional. ≤ 80 chars. |
| `body` | string | Required. ≤ 500 chars. |

Purpose: Persist a lightweight reflective note locally and optionally sync to Supabase when online.

### `create_ics_event`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `title` | string | Required. ≤ 80 chars. |
| `start_iso` | string | Required. ISO-8601 with offset. |
| `duration_minutes` | integer | Required. 15–180 minutes. |
| `description` | string | Optional. ≤ 300 chars. |

Purpose: Generate an `.ics` file payload so users can add events to their calendar manually. The assistant should only call this when a reminder would be insufficient.

## Parser Outcomes

| Outcome | Description |
| ------- | ----------- |
| `tool_call: null` | No fenced tool block was found. |
| `validation.valid === true` | A supported tool with valid arguments. Client should show confirmation UI. |
| `validation.valid === false` + issues | Assistant proposed a tool but args were invalid. Client shows inline warning. |
| `name === "invalid"` | JSON failed to parse or missing `name`. Client displays the assistant prose without tooling. |

The parser never mutates message text beyond removing the fenced block and trimming whitespace.

## Client Responsibilities

1. Respect `metadata.tool_call.validation.valid`. Only valid tool calls may be confirmed.
2. Request permissions (notifications, location) at confirmation time, not earlier.
3. Post a short confirmation/failure message back to the conversation to keep context aligned across devices.
4. Emit analytics (`chat_tool_proposed`, `chat_tool_confirmed`, `chat_tool_failed`) with `{ name, cause? }`.

## Prompt Requirements

The system prompt must:

- Describe each supported tool, argument expectations, and length limits.
- Instruct the assistant to propose tools only when clearly helpful and to always wait for user confirmation.
- Explicitly forbid silent tool execution or collection of precise location.

Any prompt change must be hidden behind the `CHAT_ENABLE_TOOL_CALLS` feature flag for rollback safety.
