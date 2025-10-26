# Dual AI Chat, Voice Mode, Celebrations, and Memory Preference — Execution Plan (plan_id: FEAT-dual-ai-v1)

## Overview
Enable two assistants (Fermi & Atlas) with isolated threads, add a user preference for memory sharing, deliver voice input/TTS, and add visual polish (orbit & subtle confetti). Expected impact: clearer personas, higher engagement, lower friction to share via voice, small delights.

## Architecture Outline
- **Components**
  - PromptBuilder, ChatStreamAPI, ChatHistoryAPI, PreferencesAPI, TranscribeAPI, (optional) SynthesizeAPI
  - WebChatUI, MobileChatScreen
  - SharedApiClient (assistant-aware)
  - Analytics events
- **Interfaces**
  - `GET /api/chat/history?assistant=fermi|atlas`
  - `POST /api/chat/stream` (SSE) `{ message, assistant, options? }`
  - `GET|PUT /api/user/preferences`
  - `POST /api/chat/transcribe` (multipart/form-data)
  - `POST /api/chat/synthesize` (optional)
- **Data model/migrations**
  - New enum `assistant_kind` with values `fermi`, `atlas`
  - `chat_sessions.assistant_type assistant_kind not null default 'fermi'`
  - `profiles.allow_memory_sharing boolean not null default false`
  - Indexes: `(user_id, assistant_type)`, `(user_id, created_at desc)` remains
  - Backfill existing rows with `'fermi'`
- **Quality budgets**
  - Perf p50 200ms, p95 800ms (non-stream parts); reliability 99.9%; auth on all endpoints; no audio storage by default; SSE heartbeats.

## Scope & Non-Goals
- In: assistant routing, prompts, UI toggles, voice input/TTS MVP, confetti & orbit visuals, DB preference.
- Out: cross-assistant memory logic, advanced gamification, server TTS productionization, real-time WebRTC.

## Assumptions
- STT: Whisper-compatible; TTS: Web Speech (web) & Expo Speech (mobile); no audio persistence.
- Switching assistants auto-creates a per-assistant session.
- Preference is server-persisted for authenticated users; LS fallback for preview.

## Checkpoints
- **C1 DB & API** — Proof: migration applied; history/stream accept `assistant`.
- **C2 Prompts** — Proof: PromptBuilder returns distinct Fermi vs Atlas.
- **C3 Voice** — Proof: audio → transcript JSON → message with `metadata.voice.input`.
- **C4 Visuals** — Proof: orbit while Fermi streaming; confetti on quest completion.

## Milestones & Tasks
- **M1 Dual assistant foundation**
  - T1.1 Migration (enum, columns, indexes, backfill) (est_verify_loops: 2)
  - T1.2 PromptBuilder refactor; Atlas prompt
  - T1.3 `/stream` & `/history` accept/use `assistant`; `ensureChatSession(user, assistant)`
  - T1.4 api-client adds `AssistantType` and passes assistant to endpoints
- **M2 Client toggles & threads**
  - T2.1 Web store/UI toggle; thread routing; analytics
  - T2.2 Mobile header segmented control; routing; analytics
  - T2.3 Emit `assistant_switched`
- **M3 Voice mode MVP**
  - T3.1 `/transcribe` endpoint
  - T3.2 api-client `transcribeAudio()`; `options.source='voice'`
  - T3.3 Mobile: expo-av record; expo-speech playback
  - T3.4 Web: MediaRecorder; SpeechSynthesis playback
- **M4 Visuals**
  - T4.1 Orbit components (web+mobile)
  - T4.2 Confetti (canvas-confetti; RN particles) + haptic; hook into quest completion
- **M5 Memory preference**
  - T5.1 Preferences API
  - T5.2 Web toggle + LS fallback
  - T5.3 Mobile toggle UI

## Verification Plan
- Global:
  - `pnpm -w build`
  - `pnpm -w test`
- By Milestone:
  - M1: `pnpm -w build`
  - M3: `pnpm -w test` (unit for metadata normalization & PromptBuilder)
- UI Snapshots: auto; accept minor diffs for orbit/typing.

## Definition of Done
- Separate assistant threads, distinct prompts, persisted preference, voice roundtrip, TTS toggle, orbit + confetti, analytics events.

## Coverage Matrix
- Separate threads → T1.3, T2.1, T2.2 → manual toggle & reload
- Voice input → T3.1–T3.4 → record small sample, transcript appears
- Preference persisted → T1.1, T5.1–T5.3 → GET/PUT + reload
- Visuals → T4.1–T4.2 → observe during streaming & quest completion

## Arch Guardrails (must hold)
- Contracts: SSE event order; assistant param required; idempotent session guarantee per (user, assistant).
- Data: backfill `'fermi'`; preference default false; metadata additions remain optional.
- Concurrency: streaming writes append-only; no race in session creation.
- Migrations/Rollout: additive; deploy API before clients; defaults maintain compatibility.
- Performance: keep SSE tokenization; avoid blocking in endpoints.

## Risks & Mitigations
- Media/API permissions → graceful fallbacks & clear copy.
- Prompt divergence → central prompt definitions; unit snapshots.
- RLS/index mismatch → composite indexes; query update to filter by assistant_type.

## Residual Risks / Follow-ups
- Point a cron job or Supabase scheduled task at `/api/nudges` creator (or add dedicated seeding script) so the `nudges` table receives weekly/stale intents automatically.
- Run the new migration in your Supabase instance (`supabase db push`) before deploying API/mobile changes.
- Consider persisting executed tool confirmations to `actions_log` from the server for parity; mobile currently only logs analytics.

## Next Actions (Optional)
- Configure notification permission education (deep link to Settings) for repeated nudge failures.
- Add automated tests for `syncPendingNudges` once Expo Notification mocks are in place.

## Progress (to be updated by Execution-Agent)
- [ ] C1
- [ ] M1:
  - [ ] T1.1
  - [ ] T1.2
  - [ ] T1.3
  - [ ] T1.4
- [ ] M2:
  - [ ] T2.1
  - [ ] T2.2
  - [ ] T2.3
- [ ] M3:
  - [ ] T3.1
  - [ ] T3.2
  - [ ] T3.3
  - [ ] T3.4
- [ ] M4:
  - [ ] T4.1
  - [ ] T4.2
- [ ] M5:
  - [ ] T5.1
  - [ ] T5.2
  - [ ] T5.3

## Decision Log (to be updated by Execution-Agent)
- <date> — <decision> — <reasoning>

## UNBLOCK REQUEST Template
- Problem:
- Attempts:
- Options (A/B/C):
- Preferred:
- Need from human:
