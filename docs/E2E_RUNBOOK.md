# Mobile Tool Bridge - E2E Runbook

## Prerequisites

- Expo dev server running with `CHAT_ENABLE_TOOL_CALLS=1`.
- Device or simulator with notifications, location, and file sharing enabled.
- Logged-in user linked to Supabase dev project.

## 1. Schedule Reminder

1. Prompt Fermi: “Set a check-in reminder for 3pm tomorrow.”
2. Confirm the sheet.
3. Verify:
   - Local notification scheduled in Expo DevTools (`Notifications` tab).
   - Chat shows system message: “Reminder scheduled for …”.
   - Supabase `chat_messages.metadata.tool_call.result.status === "confirmed"` with `scheduledFor`.
4. Dismiss flow: trigger again, tap secondary CTA → status becomes `dismissed`, `chat_tool_dismissed` logged.

## 2. Start Timer

1. Prompt: “Start a 10 minute deep work timer.”
2. Confirm; ensure countdown notification appears after 10 minutes (or reduce to 1 minute for faster test).
3. Check Supabase metadata includes `timer.duration_seconds` and analytics payload includes duration.

## 3. Share Location

1. Prompt: “Where am I likely to focus best based on where I am?”
2. Accept permission; chat should confirm with city/region (no coordinates).
3. Deny path: revoke permission in Settings, retry, ensure alert appears and sheet stays open.

## 4. Save Note

1. Prompt: “Save a note titled Momentum with body ‘Celebrate small wins nightly.’”
2. Confirm; system message acknowledges saved note.
3. Inspect AsyncStorage via Expo custom dev menu (`@purpose/tool-notes/v1`) to verify note exists with id/title only.

## 5. Create Calendar File

1. Prompt: “Create a calendar event for a 30 minute planning block tomorrow at 9am.”
2. Confirm; share sheet should open with `.ics` file.
3. If sharing unavailable, ensure confirmation message mentions local save and analytics logs `{ shared: false }`.

## 6. Web Read-Only Sanity

1. Open the same conversation on web after running steps above.
2. Verify each assistant message shows the tool badge with status (confirmed/dismissed) and no runtime errors surface.

## 7. Analytics Smoke Check

- Use analytics debug console to confirm events for each tool (`chat_tool_*`).
- Ensure failure codes appear when permissions are denied.
