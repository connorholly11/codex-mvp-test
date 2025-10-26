# Mobile Tool Bridge Runbook

## Overview
- The chat assistant can propose two device-side actions: `schedule_reminder` and `get_location`.
- The backend attaches the parsed tool call to `chat_messages.metadata.tool_call`; the mobile client shows a confirmation card, executes the tool locally, and writes a short confirmation back to Supabase as a `system` message.
- Web surfaces display the proposal and any resulting status as read-only context.

## Feature Flag
- Set `CHAT_ENABLE_TOOL_CALLS=1` in the Next.js environment to allow the assistant to emit tool-call blocks.
- Removing or setting the flag to any other value reverts the prompt to the legacy (no tool) instructions.

## Mobile UX Details
- Reminder confirmation card copy:
  - Title: “Set a follow-up reminder”
  - Body template: “We'll queue a device notification for <formatted time>.”
  - Secondary button text: “No thanks”
- Location confirmation card copy:
  - Title: “Share your current city”
  - Body: “Share city-level location context so Fermi can ground future check-ins. We never store precise coordinates.”
  - Secondary button text: “No thanks”
- Analytics events emitted:
  - `chat_tool_proposed` (tool name)
  - `chat_tool_confirmed` (tool name plus scheduled time or location label)
  - `chat_tool_failed` (tool name and error message)
  - `chat_tool_dismissed` (tool name)

## Manual E2E Checklist
1. Reminder flow
   - Launch Expo app with `CHAT_ENABLE_TOOL_CALLS=1`.
   - Prompt Fermi: “Set a check-in reminder for 3pm tomorrow.”
   - Confirm on mobile; observe local notification in Expo Notifications scheduled list.
   - Verify a `system` message is appended summarising the reminder.
   - Confirm Supabase `chat_messages` record contains `metadata.tool_call.result.status === "confirmed"`.
2. Reminder dismissal
   - Prompt similar request.
   - Tap “No thanks”; check analytics for `chat_tool_dismissed`.
   - Confirm `metadata.tool_call.result.status === "dismissed"`.
3. Location flow
   - Trigger: “Where do you think I should focus based on where I am?”
   - Accept permission; ensure confirmation card logs city/region.
   - Deny permission on second run; confirm card shows error and no confirmation message is inserted.
4. Web read-only
   - Open `/chat` on web after the above actions.
   - Confirm reminder proposal badge shows time and status.
   - Confirm location badge shows shared city or pending text.

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
