# Mobile Tools + Proactive Nudges (API-compatible) — Execution Plan (plan_id: FEAT-mobile-tool-bridge-v2)

## Overview
Make Fermi feel more alive and helpful by enabling **safe, confirmable tools on mobile** (reminders, timers, location, notes, calendar ICS) and **gentle proactive nudges** (weekly pulse + stale-check). We keep the current Next.js API + shared client; we add a **tool manifest**, **server parser** that attaches `tool_call` metadata, a **mobile confirm sheet + adapter**, and **two additive tables** (`nudges`, `actions_log`). No context/memory yet—reserved for a mem0 phase.

## Architecture Outline
- Components:
  - Tool Manifest & Validator — declare tools, zod schemas, consent copy; shared by server/client.
  - Server Stream Parser — parse fenced tool JSON; attach `metadata.tool_call`; feature-flagged.
  - Tool Bridge (Client, Mobile) — confirm/cancel UI; execute local tools; post confirmations; analytics.
  - Web Read-Only Renderer — suggestive card + .ics fallback.
  - Proactive Nudge Engine — cron populates `nudges`; mobile polls & schedules locally.
- Interfaces:
  - Tool-Call Block Protocol — fenced ```tool JSON in assistant text.
  - Streaming Final Event (extended) — `{metadata: { tool_call? }}`.
  - Nudges API — GET pending; POST status.
- Data model/migrations:
  - Additive: `nudges`, `actions_log` (see `NUDGES_SCHEMA.sql`).
  - Use existing `chat_messages.metadata` to store `tool_call`.
- Quality budgets:
  - Perf p50 200ms / p95 800ms unchanged; reliability 99.9%; privacy: ephemeral location, minimal logs; operability: flags + analytics.

## Scope & Non-Goals
- In:
  - Tools: `schedule_reminder`, `start_timer`, `get_location` (coarse), `save_note`, `create_ics_event`.
  - Nudges: weekly pulse + stale-check; mobile schedules locally.
  - Web: read-only suggestion card + .ics fallback.
- Out:
  - Context/memory building (deferred to mem0 integration).
  - Server-executed tools or server push scheduling.
  - Storing raw coordinates or sensitive note content.

## Assumptions
- Two-turn UX is acceptable (proposal → confirmation → follow-up message).
- ISO-8601 with timezone offset required in tool args.
- Location remains ephemeral; only city/region is displayed.
- Feature flags available to disable tools quickly.

## Checkpoints
- **C1 Server parses tool blocks** — Proof: assistant message contains `metadata.tool_call`; parser tests pass.
- **C2 Mobile executes reminder/location** — Proof: OS reminder scheduled; permission happy/denied paths handled.
- **C3 Nudge pipeline** — Proof: pending `nudges` fetched and scheduled; status updated.

## Milestones & Tasks
- **M1 Protocol + Parser + Types**
  - T1.1 Define tool protocol & consent copy (est_verify_loops: 2)
  - T1.2 Specify manifest & args schemas (2)
  - T1.3 Extend API client metadata contract (2)
  - T1.4 Parser test plan & cases (2)
  - Acceptance:
    - `TOOL_PROTOCOL.md` defines fenced JSON + tools list
    - Parser attaches `tool_call` with validation result
    - Client types expose `metadata.tool_call`
- **M2 Mobile Tool Bridge**
  - T2.1 Confirm sheet spec (2)
  - T2.2 Tools adapter spec (2)
  - T2.3 Analytics events documented (1)
  - T2.4 E2E runbook (1)
  - Acceptance:
    - Reminder & location work with consent
    - Confirmation message posted; analytics visible
- **M3 Nudges + Web Read-Only + Tokens**
  - T3.1 Additive SQL for `nudges` & `actions_log` (1)
  - T3.2 Nudges API spec (1)
  - T3.3 Web suggestion card spec (1)
  - T3.4 Design tokens doc (1)
  - Acceptance:
    - Tables migrate cleanly; poll/update flow documented
    - Web card spec finalized; tokens ready

## Verification Plan
- Global:
  - `pnpm test:run`
  - `pnpm --filter web lint`
  - `pnpm --filter mobile typecheck`
- By Milestone:
  - M1: `pnpm test:run` (parser/unit tests)
  - M2: `pnpm --filter mobile typecheck` + `E2E_RUNBOOK.md`
  - M3: `pnpm --filter web lint` + `pnpm test:run`
- UI Snapshots: none (manual E2E sufficient)

## Definition of Done
- `metadata.tool_call` present on assistant messages when applicable; no regressions in SSE.
- Mobile confirms and executes **reminder** and **location**; posts a clear confirmation to chat.
- Nudges → mobile scheduling loop demonstrated; analytics events (`chat_tool_*`, `nudge_*`) recorded.

## Coverage Matrix
- Parser attaches tool_call → T1.1/T1.2/T1.4 → `pnpm test:run`
- Mobile executes reminder/location → T2.1/T2.2/T2.4 → `E2E_RUNBOOK.md`
- Nudges loop → T3.1/T3.2 → `pnpm test:run`

## Arch Guardrails (must hold)
- Contracts: only fenced ```tool JSON parsed; server never executes device tools; client requires explicit confirmation.
- Data: no raw coordinates persisted; actions log is minimal, non-sensitive.
- Concurrency: one active confirmation sheet per conversation; idempotent scheduling.
- Migrations/Rollout: additive SQL; rollback included; tool prompt behind a feature flag.
- Performance: unchanged budgets (p50 200ms / p95 800ms).

## Risks & Mitigations
- Over-eager tool proposals → confirmation gate + per-tool feature flags.
- Time ambiguity → ISO datetime required; decline if missing.
- Parser fragility → strict fence header; schema validation; tests.
- Privacy concerns → consent copy; ephemeral location; analytics without PII.

## Progress (to be updated by Execution-Agent)
- [x] C1
- [ ] M1:
  - [x] T1.1
  - [x] T1.2
  - [x] T1.3
  - [x] T1.4
- [ ] C2
- [ ] M2:
  - [ ] T2.1
  - [ ] T2.2
  - [ ] T2.3
  - [ ] T2.4
- [ ] C3
- [ ] M3:
  - [ ] T3.1
  - [ ] T3.2
  - [ ] T3.3
  - [ ] T3.4

## Decision Log (to be updated by Execution-Agent)
- 2025-10-26 — Completed T1.1 (Tool protocol & consent copy) — Authored `TOOL_PROTOCOL.md` and `TOOL_CONSENT_COPY.md`; conformance checklist holds (no DB change, no external calls, validation captured in spec).
- 2025-10-26 — Completed T1.2 (Tool manifest & schemas) — Added `ACTIONS_MANIFEST_SPEC.md` and shared manifest module `packages/api-client/src/tool-manifest.ts` with zod validators; no database or network changes introduced.
- 2025-10-26 — Completed T1.3 (API client metadata contract) — Extended `packages/api-client` metadata helpers to reuse the manifest for validation and updated exports; verification suite remains green.
- 2025-10-26 — Completed T1.4 (Parser test plan & cases) — Parser now reuses the shared manifest with expanded Vitest coverage (valid, invalid, malformed, multi-block scenarios) and passes full verification suite.

## UNBLOCK REQUEST Template
- Problem:
- Attempts:
- Options (A/B/C):
- Preferred:
- Need from human:
