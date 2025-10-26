# Execution Rules for plan_id: FEAT-dual-ai-v1

- Work on branch `feat/FEAT-dual-ai-v1-dual-ai`.
- Per task: implement minimal diff → run verification → update **Progress** and **Decision Log** in `plans.md` → commit:
  - `[FEAT-dual-ai-v1][T1.2] Refactor: add Atlas prompt builder`
- If verification is red for 2 consecutive loops or secrets/config are missing, write **UNBLOCK_REQUEST** in `plans.md` and halt.
- Trigger review after each milestone; address feedback; re‑verify.
- Prefer surgical diffs; avoid unrelated refactors.
- Record any new/changed verification commands in `plans.md`.
- Keep API **backward compatible**: defaults to `assistant='fermi'` if omitted until all clients updated.
- Respect PII: do not log message content; only event names and non-sensitive counts/durations.
