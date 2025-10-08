# Transitioning to a Full MVP with Supabase + Anthropic

This document records everything needed to evolve the local-only prototype into a production-ready web MVP powered by Supabase (auth + persistence) and Anthropic (coaching responses). It also folds in decisions about subscriptions, analytics, voice, and scaling so we have a single reference.

---

## 1. Replace Local Stores with Supabase Persistence

### Current state
- Onboarding data, chat history, quests, and reports live inside Zustand stores backed by `localStorage`.
- Chat replies are simulated from onboarding summaries; nothing touches a server.

### Target state
- All user-specific state resides in Supabase Postgres with Row-Level Security (RLS).
- Next.js components rehydrate from Supabase queries (Zustand can stay as a client cache synced to database updates).

### Action items
1. **Supabase project + schema** (example tables):
   - `profiles` (user_id, display_name, legal_acceptance_at, created_at)
   - `assessments` (id, user_id, payload JSONB, completed_at)
   - `chat_messages` (id, user_id, role, content, metadata JSONB, created_at)
   - `quests_progress` (id, user_id, quest_id, answer JSONB, completed_at)
   - `reports` (id, user_id, report_id, content JSONB, generated_at)
   - Optional: `weekly_reports`, `quests_catalog`, etc. for server-defined content.
2. **Enable RLS** so users can only access their own rows.
3. **Convert stores/hooks**:
   - Swap out `localStorage` persistence for Supabase reads/writes (Zustand can mirror Supabase state locally).
   - On onboarding submit, call `/api/onboarding` → insert assessment, generate report server-side, store in `reports`.
   - `/api/chat` (Section 2) handles message persistence and AI replies.
   - Quest completion writes to `quests_progress` instead of local arrays.
4. Update Journey & Report views to read from Supabase rather than local JSON.

**Environment variables**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   # server-only
```

---

## 2. Wire Anthropic for Chat Streaming

### Current state
- Chat responses are handcrafted based on onboarding summaries.

### Target state (Phase 1)
- Next.js Node-runtime API route streams replies from Anthropic using conversation history + the personal report summary.
- Heartbeats keep the SSE connection alive; we enforce a 30s max duration to stay within the product spec.

### Target state (Phase 2 option)
- If concurrency regularly exceeds ~600 simultaneous streams (or we plan a large launch), mirror the same handler in a dedicated Chat Gateway service (Fastify/Hono/Go) deployed on Fly.io/ECS and swap the base URL in `packages/api-client`.

### Action items
1. Create `/api/chat/stream` (Node runtime):
   - Authenticate via Supabase session.
   - Insert the user message into `chat_messages`.
   - Build model context: latest N messages + Personal Insights summary pulled from `reports`.
   - Call Anthropic’s streaming endpoint with `ANTHROPIC_API_KEY`.
   - Stream tokens back to the client, send heartbeats every ~15s, cap the stream at 30s, and persist the assistant message when complete.
2. Update chat client to use this route via the shared `chatStream` helper.
3. Add rate limiting & retries to stay within Anthropic quotas; optionally cache deterministic responses (e.g., report summaries).
4. Prepare the Chat Gateway service skeleton so it’s easy to enable when traffic warrants it.

**Environment variables**
```
ANTHROPIC_API_KEY
ANTHROPIC_MODEL_NAME (optional)
CHAT_GATEWAY_URL (optional, for Phase 2)
```

---

## 3. Personal Insights Report Enhancements

Requirements from product:
- Report insights should appear as chat bubbles inline with the conversation.
- Tapping the bubble opens a richer, interactive report viewer with clickable sections.

Action items:
1. Ensure report drop-ins are assistant messages with metadata (already implemented in chat). Keep them inline only.
2. Build an interactive viewer (accordion, tabs, or side navigation) showing each section with visuals and progress states.
3. Persist report completion/viewed state in Supabase so it syncs across devices.
4. Keep the chat CTA (“View full report”) linking to the dedicated report page or modal.

---

## 4. Authentication & Session Flow

- Use Supabase Auth (magic links/passwordless) to replace the prototype account step.
- After onboarding, update `profiles.legal_acceptance_at`.
- Gate all API routes with Supabase session checks; rely on RLS for row-level permissions.
- Clerk (from the mobile spec) isn’t required in the web MVP if Supabase Auth suffices.

---

## 5. Deployment & Runtime Checklist

1. Supply `.env.local.example` with Supabase + Anthropic keys (later include Stripe/RevenueCat if needed).
2. Configure `next.config.js` if you need to expose Supabase env variables client-side or adjust streaming settings.
3. Keep the local analytics inspector until you install a full telemetry provider (e.g., PostHog).
4. Validate end-to-end flows with real data: onboarding → reports → chat → quests → journey.
5. Deploy to Vercel (or similar) and point environment variables at the Supabase project.

---

## 6. Subscriptions & Payments (Future)

- **Stripe** (for web checkout) and **RevenueCat** (for cross-platform entitlements) both work inside Next.js API routes.
- Use webhook handlers to update Supabase (`profiles.subscription_status`, trial expiration, etc.).
- Required env vars when ready:
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `REVENUECAT_API_KEY`
- No dedicated backend needed unless you want elaborate billing orchestration.

---

## 7. Analytics

- PostHog can be added immediately via client/server SDK without architectural changes.
- Keep the local analytics inspector for debugging until you finalize the analytics stack.
- Track key events (onboarding_completed, quest_completed, chat_message_sent, chat_response_completed) and send to PostHog when available.

---

## 8. Voice Support (Non Real-Time)

- Voice input: record audio in the browser → upload to API route → call STT provider (Whisper, Deepgram, Supabase AI) → feed text back into chat flow.
- Voice output: after Anthropic replies, call TTS provider (11Labs, Azure, AWS Polly) → store audio in Supabase Storage → return signed URL to the client.
- No dedicated backend required; serverless routes are sufficient.
- Real-time streaming voice (WebRTC) would require separate media services—out of scope for now.

---

## 9. Background Jobs

- Supabase cron + Edge Functions handle weekly reports, daily quest reminders, push/email triggers.
- This setup scales until job runtimes exceed limits or you need heavy parallelism. At that point move to a queue/worker (BullMQ, Temporal, Cloud Run jobs, etc.).

---

## 10. Scaling Considerations

### Supabase capacity
- Upgrade to Pro/Team tier with PgBouncer connection pooling.
- Index `user_id` columns; monitor Postgres CPU/IO in Supabase dashboard.
- For large launches (e.g., Mark Manson’s audience), scale the Postgres instance and ensure connection pooling is configured.

### Anthropic rate limits
- Request higher throughput before major launches.
- Apply per-user throttling/backoff to handle spikes.
- Cache deterministic outputs where appropriate.

### When to consider a dedicated backend
- Sustained streaming concurrency above ~600 sessions or a high-profile launch where cold starts cannot be tolerated (move `/api/chat/stream` into the Chat Gateway service and point clients at it).
- Long-running or high-volume jobs beyond Supabase cron limits.
- Real-time voice streaming/WebRTC.
- Advanced analytics/event pipelines shared across platforms.
- Unified business logic consumed by multiple clients (web, iOS, Android) when duplicating logic in Next.js becomes risky.

Until those needs appear, staying “all-in Next.js + Supabase + Anthropic” is perfectly viable, with the chat gateway as an easy upgrade when traffic demands it.

---

## 11. Summary

Supabase + Anthropic + Next.js can deliver:
- Web onboarding, chat, quests, journey, and personal reports.
- Voice-to-text and text-to-speech loops (non real-time).
- Subscriptions via Stripe/RevenueCat webhooks.
- Scheduled jobs via Supabase cron.
- Large-scale launches when Supabase resources and Anthropic quotas are upgraded.

A separate backend becomes necessary only when you need persistent workers, real-time voice, advanced analytics/memory, or multi-platform shared services.
