# Mobile Tool Bridge - Tools Adapter Spec

## Module

`apps/mobile/lib/tools-adapter.ts`

## Responsibilities

- Accept validated `AssistantToolCall` payloads coming from the chat stream.
- Execute the corresponding on-device action (notifications, location, note storage, calendar export).
- Return a normalized result for the chat screen:
  - `confirmationText` shown to the member and stored as a `system` message.
  - `metadataContext` merged into `metadata.tool_call.result.context`.
  - `analyticsPayload` merged into `chat_tool_confirmed`.
- Surface predictable failures via `ToolExecutionError` with a `code`.

## Supported Tools

| Tool | Execution | Result Context | Notes |
| ---- | --------- | -------------- | ----- |
| `schedule_reminder` | Schedules a one-off Expo notification at an absolute `fireDate`. | `{ scheduledFor, notificationId }` | Requires notifications permission; minimum lead time 60s. |
| `start_timer` | Schedules a countdown notification `{ seconds, repeats:false }`. | `{ timer: { duration_seconds, fireDate, notificationId, label } }` | Shares the same permission flow as reminders. |
| `get_location` | Requests foreground location, reverse geocodes to coarse city/region. | `{ location: { city, region, country } }` | Never returns latitude/longitude. |
| `save_note` | Stores note in AsyncStorage (`@purpose/tool-notes/v1`). | `{ note: { id, title, createdAt } }` | Body never leaves the device. |
| `create_ics_event` | Generates `.ics` file in cache and opens the share sheet via `expo-sharing`. | `{ event: { title, start_iso, duration_minutes, shared } }` | If sharing is unavailable, we still return success with `shared: false`. |

## Error Codes

| Code | Meaning | Typical UI Handling |
| ---- | ------- | ------------------- |
| `validation_error` | Tool args failed extra validation (e.g. invalid timestamp). | Dismiss card automatically and mark tool as `dismissed`. |
| `permission_denied` | System permission missing or revoked. | Show alert, keep card visible for retry. |
| `share_unavailable` | File sharing could not launch. | Alert and keep card visible. |
| `not_supported` | Model proposed an unknown tool. | Treat as generic failure; logged via `chat_tool_unknown`. |
| `unknown` | Unexpected error. | Show inline error and keep card visible. |

## Analytics

`executeTool` returns optional `analyticsPayload`; the caller merges it into `chat_tool_confirmed`. For failures, `ToolExecutionError.code` is logged via `chat_tool_failed`.

## Testing Notes

- Unit tests live in `tests/chat-tools.test.ts` to cover manifest parsing and invalid payloads.
- Mobile typecheck ensures new helpers are wired through the chat screen.
