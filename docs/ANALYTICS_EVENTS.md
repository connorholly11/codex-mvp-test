# Tool Bridge Analytics Events

All events route through `@purpose/analytics`. Names are kebab-case, payloads are flat JSON.

## Event Catalog

| Event | When | Payload |
| ----- | ---- | ------- |
| `chat_tool_proposed` | When the mobile client surfaces a confirmation sheet. | `{ name: ToolName }` |
| `chat_tool_confirmed` | After the tool executes successfully and metadata persists. | `{ name: ToolName, ...result.analyticsPayload }` |
| `chat_tool_failed` | When execution throws (permissions, validation, unknown). | `{ name: ToolName, code: string, message: string }` |
| `chat_tool_dismissed` | User taps the secondary CTA. | `{ name: ToolName }` |
| `chat_tool_unknown` | Model proposed a tool not in the manifest. | `{ name: string }` |

## Payload Notes

- `ToolName` matches the manifest keys (`schedule_reminder`, `start_timer`, `get_location`, `save_note`, `create_ics_event`).
- `analyticsPayload` examples:
  - Reminder → `{ scheduledFor: ISOString }`
  - Timer → `{ duration_seconds: number }`
  - Location → `{ location: string }`
  - Note → `{ noteId: string }`
  - Calendar → `{ shared: boolean }`
- `message` in `chat_tool_failed` should be human readable for debugging; we already gate sensitive data upstream.

## Dashboards

- **Funnel:** proposed → confirmed/dismissed/failed per tool.
- **Permission health:** filter `code === "permission_denied"`.
- **Calendar adoption:** track how often `shared` is `true` vs `false`.
