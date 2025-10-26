# Mobile Tool Bridge - Confirm Sheet Spec

## Purpose

Give members a clear, consent-first way to approve or decline Fermi's device tool proposals. The confirm sheet appears whenever an assistant message contains a validated `tool_call` and the user has not yet acted on it.

## Layout

1. **Coach badge** - uppercase "Coach suggestion".
2. **Title** - dynamic per tool (see table below).
3. **Body copy** - one or two sentences describing what will happen if confirmed.
4. **Highlight card** - contextual details (time, duration, note preview, etc.).
5. **Error pill** (conditional) - surfaced when execution fails; clears when the user retries or dismisses.
6. **Footnote** - optional privacy or next-step reminder.
7. **Primary CTA** - confirm action; disabled while `isExecutingTool === true`.
8. **Secondary CTA** - cancel/dismiss; disabled while executing.

The sheet uses the "modern calm" styling: soft violet palette, 20px radii, 14-18px typography, and 12px vertical rhythm. Animations follow the existing `animateLayout()` pattern (~180 ms spring).

## Copy Map

| Tool | Title | Body | Highlight | Footnote | Primary CTA | Secondary CTA |
| ---- | ----- | ---- | --------- | -------- | ----------- | -------------- |
| `schedule_reminder` | Schedule this reminder? | Fermi will set a one-time reminder on your device for the time you confirm. | `Target time: <formatted datetime>` | Reminders stay on this device. | Schedule reminder | Not now |
| `start_timer` | Start this timer? | Fermi can keep a countdown in the background and ping you when time is up. | `Duration: <friendly duration>\nLabel: <optional>` | Timers rely on local notifications. | Start timer | Cancel |
| `get_location` | Share your city? | Fermi will pull your coarse city + region to tailor guidance. | "No precise coordinates are stored - ever." | You can revoke access later in Settings. | Share city | Keep private |
| `save_note` | Save this note? | The note stays private to you. We'll sync it later if you're online. | `Title: <optional>\nPreview: <trimmed body>` | Saved notes will surface in profile soon. | Save note | Skip |
| `create_ics_event` | Create calendar file? | Fermi will generate a downloadable .ics file so you can add it anywhere. | `Event: <formatted window>` | You'll choose where to add it once the share sheet opens. | Create .ics file | Maybe later |

All copy lives inline for now; when localization arrives, lift strings into the translation layer using the same keys.

## Interaction Rules

- Show at most one sheet per conversation at a time (`pendingTool` guard).
- Disable buttons while `isExecutingTool` is true; swap primary CTA label to "Working...".
- If execution succeeds, dismiss the sheet, vibrate (`hapticNotificationSuccess`), and log `chat_tool_confirmed`.
- If execution fails, keep the sheet open, show the error pill, and log `chat_tool_failed` with `{ name, code, message }`.
- On dismissal, call `chat_tool_dismissed` and persist `metadata.tool_call.result.status = "dismissed"`.

## Accessibility

- Minimum touch target 48x48px.
- Ensure highlight card text is >= 4.5:1 contrast.
- Respect Reduced Motion by skipping layout animations (future work tracked separately).
