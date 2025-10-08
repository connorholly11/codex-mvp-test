# Transitioning to a Full MVP with Supabase + Anthropic

This document outlines the changes required to evolve the current local-only prototype into a production-worthy web MVP powered by Supabase (auth + persistence) and Anthropic (coaching responses). It also captures UX improvements requested for the Personal Insights report experience.

---

## 1. Replace Local Stores with Supabase Persistence

### Current State
- Onboarding data, chat history, quests, and reports live inside Zustand stores with `localStorage` persistence.
- Chat responses are simulated locally from onboarding summaries.

### Target State
- All user-specific state is stored server-side in Supabase Postgres with Row-Level Security.
- Rehydrate Next.js components via Supabase hooks/queries instead of local-only Zustand state.

### Action Items
1. **Set up Supabase project** and create the following tables (sample schema):
   - `profiles` (user_id, display_name, legal_acceptance_at, created_at)
   - `assessments` (id, user_id, payload JSONB, completed_at)
   - `chat_messages` (id, user_id, role, content, metadata JSONB, created_at)
   - `quests_progress` (id, user_id, quest_id, answer JSONB, completed_at)
   - `reports` (id, user_id, report_id, content JSONB, generated_at)
   - Optional supporting tables (`quests`, `report_versions`) if you want server-defined catalogs.
2. **Enable Row-Level Security** so each user only accesses their rows.
3. **Update stores/hooks**:
   - Replace local `persist` storage with Supabase reads/writes (Zustand can remain as an in-memory cache synced to Supabase).
   - On onboarding submit, POST to `/api/onboarding` → insert assessment, generate report content server-side, store in `reports` table.
   - Chat UI becomes a client for Supabase-backed `/api/chat` (see section 2).
   - Quest completions write to `quests_progress` instead of local arrays.
4. **Sync Journey & Report views** to pull from Supabase rather than local data.

**Env Vars Required**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only for secure inserts/updates)

---

## 2. Wire Anthropic for Real-Time Coaching

### Current State
- Responses are handcrafted from onboarding summaries; no external API.

### Target State (Phase 1)
- A Next.js API route streams Anthropic completions using the persisted conversation history + personal report context.
- Streaming runs in the **Node runtime** (not Edge) so we get Vercel’s 60‑second execution window—more than enough for our ≤30s responses.

### Target State (Phase 2 Option)
- If concurrency regularly exceeds ~600 simultaneous streams or we prepare for a large launch, we can move the streaming handler into a dedicated Chat Gateway service (Fastify/Hono/Go) without touching the clients—only swap the base URL in `packages/api-client`.

### Action Items
1. **Phase 1 – Next.js API route (`/api/chat/stream`):**
   - Authenticate via Supabase session.
   - Write incoming user message to `chat_messages`.
   - Build model context: latest N messages + Personal Insights summary.
   - Call Anthropic’s streaming endpoint (`ANTHROPIC_API_KEY`).
   - Stream tokens back to the browser, sending heartbeats every 15s, and write the assistant message once streaming finishes.
   - Enforce a 30s max duration; if the stream exceeds it, finish server-side and send a “tap to reveal final answer” callout.
2. **Phase 2 – Optional Chat Gateway:**
   - Mirror the same handler in a long-lived service (Fly.io, ECS, etc.) when concurrency/latency demands it.
   - Keep the client API identical; only the host/URL changes.
3. **Update chat client** to call the shared `chatStream` helper and persist messages via Supabase.
4. **Add usage limits/error handling** (e.g., friendly fallback when the key is missing, backoff on 429s).

**Env Vars Required**
- `ANTHROPIC_API_KEY`
- Optional: `ANTHROPIC_MODEL_NAME` if you want to configure the LLM via env.
- Optional (Phase 2): `CHAT_GATEWAY_URL`

---

## 3. Personal Insights Report Improvements

### Requirements
- Report bubbles should appear inline in the chat timeline (not only above the conversation).
- Clicking a report bubble should open a richer, engaging report view with collapsible sections or tabbed navigation.

### Action Items
1. **Chat drop-in:** ensure the initial report messages injected into chat are styled as dedicated bubbles that reference the report (already partially implemented; keep them inline only).
2. **Interactive report UI:**
   - Replace the current static markdown rendering with a sectioned viewer (e.g., accordion or side nav) to drill into each insight.
   - Highlight key metrics (values, growth area, reflections) with visuals or callouts.
   - Persist report completion status in Supabase to mirror UX across devices.
3. **CTA polish:** the chat bubble should include a clear call-to-action (e.g., “View full report”) that opens the detailed viewer in a modal or dedicated page.

---

## 4. Authentication & Session Flow

### Action Items
- Use Supabase Auth for sign-up/login (email magic links or passwordless) to replace the prototype account step.
- After onboarding completion, ensure the Supabase session is active and the user record is updated with `legal_acceptance_at`.
- Secure every API route with Supabase session checks.

---

## 5. Deployment & Runtime Checklist

1. Add a `.env.local` template detailing REQUIRED keys:
   - Supabase keys
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (optional but helpful)
2. Update `next.config.js` (if needed) to expose public Supabase URL and configure streaming routes.
3. Migrate local analytics inspector to use Supabase or keep local buffer until a full analytics tool is chosen.
4. Validate the new flow end-to-end: onboarding → report generation → chat (real replies) → quests → journey.
5. Deploy the Next.js app (Vercel or similar) and point it to the Supabase project.

---

## 6. Nice-to-Have Enhancements (Post MVP)
- Real notification scheduling (Supabase functions + cron job) for quest reminders or report updates.
- Snapshot/testing: write Playwright tests that stub Anthropic and Supabase to cover onboarding, chat streaming, and report viewing.
- Gradually replace local analytics inspector with a real telemetry provider once metrics are defined.

---

## 7. Scaling & Streaming Strategy
- **Start with Next.js streaming:** use the Node runtime (`export const runtime = 'nodejs'`) so Vercel Pro’s 60s limit comfortably covers our ≤30s responses. Send heartbeats every ~15s and enforce a 30s max duration.
- **Monitor concurrency:** if sustained concurrent streams approach ~600 or we schedule a high-profile launch, spin up the dedicated Chat Gateway (Fastify/Hono/Go) in a separate service (`apps/chat-gateway`) and point the client to its `/v1/chat/stream` endpoint. No client changes besides the base URL.
- **Keep clients agnostic:** all streaming calls should go through `packages/api-client`, making the switch between Next.js and the gateway purely configuration.
- **Continue to use Supabase for persistence:** regardless of where streaming runs, write chat messages, reports, quests, and analytics events through the same Supabase tables so both web and mobile stay in sync.

---

## Summary
With Supabase handling auth + persistence and Anthropic powering conversations, the existing code becomes a production-ready browser MVP. Start with Next.js for streaming, keep the Chat Gateway ready as traffic scales, and focus the engineering work on replacing local stores, wiring the streaming API, and enriching the report experience.
