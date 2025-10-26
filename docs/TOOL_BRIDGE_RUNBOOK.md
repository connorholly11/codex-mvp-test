# Mobile Tool Bridge Runbook

## Overview
- The chat assistant can propose five device-side actions: `schedule_reminder`, `start_timer`, `get_location`, `save_note`, and `create_ics_event`.
- The backend attaches the parsed tool call to `chat_messages.metadata.tool_call`; the mobile client shows a confirmation sheet, executes the tool locally, and writes a short confirmation back to Supabase as a `system` message.
- Web surfaces display the proposal and any resulting status as read-only context.

## Feature Flag
- Set `CHAT_ENABLE_TOOL_CALLS=1` in the Next.js environment to allow the assistant to emit tool-call blocks.
- Removing or setting the flag to any other value reverts the prompt to the legacy (no tool) instructions.

## Mobile UX Details
- Confirm sheet copy lives in `MOBILE_CONFIRM_SHEET_SPEC.md` and adapts per tool (reminder, timer, location, note, calendar).
- Highlight card shows contextual data: formatted datetime, duration, note preview, or event window.
- Secondary CTA values: "Not now" (reminder), "Cancel" (timer), "Keep private" (location), "Skip" (note), "Maybe later" (calendar).
- Analytics events emitted:
  - `chat_tool_proposed` (tool name)
  - `chat_tool_confirmed` (tool name plus analytics payload)
  - `chat_tool_failed` (tool name, error code, message)
  - `chat_tool_dismissed` (tool name)
  - `chat_tool_unknown` (unexpected manifest miss)

## Manual E2E Checklist
See `docs/E2E_RUNBOOK.md` for the full walk-through across all five tools.

## Troubleshooting
- Missing confirmation message: ensure the mobile client has the latest `supabase` anon credentials and the user session is authenticated; the insert relies on RLS `auth.uid() = user_id`.
- Reminder not firing: check iOS Settings → Notifications → Expo Go. The helper logs warning `Failed to schedule one-off reminder` when Expo rejects the trigger.
- Location lookup errors: `fetchCityLocation` logs to console; `denied` responses keep the confirmation card visible for retry.

## Verification Commands
```bash
pnpm test:run
pnpm --filter mobile typecheck
pnpm --filter web lint
```
