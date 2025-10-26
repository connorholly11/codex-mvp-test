# Execution Rules for plan_id: FEAT-mobile-tool-bridge-v2
- Work on branch `feat/FEAT-mobile-tool-bridge-v2-bridge`.
- Per task: implement minimal diff → run verification → update **Progress** and **Decision Log** in `plans.md` → commit `[FEAT-mobile-tool-bridge-v2][<task_id>] <verb>: <summary>`.
- If verification is red for 2 consecutive loops or secrets/config are missing, write **UNBLOCK_REQUEST** in `plans.md` and halt.
- Trigger review (local thread or PR) after each milestone; address findings; re-verify.
- Prefer surgical diffs; avoid broad rewrites.
- Uphold guardrails: explicit consent; fenced JSON only; no server-executed device tools; additive SQL with rollback.
- Record any new/changed verification commands in `plans.md`.
