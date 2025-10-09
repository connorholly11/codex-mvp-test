# Start Here

## One-Sentence Status
Web (Next.js) and mobile (Expo) shells are in place; Supabase/Anthropic integration is outlined but not yet wired. You can start building the real backend flows immediately.

## Install & Run
```bash
pnpm install
pnpm dev:web        # http://localhost:3000
pnpm dev:mobile     # starts Expo dev server
```

## MVP Tech Stack (for launch)
- **Web:** Next.js 15 (App Router) deployed on Vercel.
- **Mobile:** Expo React Native (iOS first) via EAS.
- **Backend services:** Supabase Postgres + Auth; Anthropic for AI replies.
- **Optional early:** Sentry for error tracking.
- **Later phases:** Stripe/RevenueCat paywalls, PostHog analytics, dedicated Chat Gateway (Fastify/Hono) when concurrency > ~600.

## Where to Start Coding
1. **Replace local stores with Supabase** – see `IMPLEMENTING_SUPABASE_ANTHROPIC.md` (root) for schema + action items.
2. **Build `/api/chat/stream`** – Node runtime route in `apps/web/src/app/api`. Keep streams ≤ 30s, send 15s heartbeats. Use `packages/api-client` for the client call.
3. **Wire onboarding/report flows** – components under `apps/web/src/features/onboarding` and `.../chat`. Persist via Supabase once the client is hooked up.
4. **Mobile app** – matches the web call pattern; once `packages/api-client` hits Supabase/Anthropic, mobile automatically benefits.

## Key Docs & References
- `IMPLEMENTING_SUPABASE_ANTHROPIC.md` (root): step-by-step plan + phased streaming guidance.
- `docs/IMPLEMENTING_SUPABASE_ANTHROPIC.md`: long-form reference (auth, voice, scaling, etc.).
- `docs/MONOREPO_MANAGEMENT.md`: pnpm workspace commands, conventions.

## Immediate Next Steps (suggested)
- Create Supabase project, apply schema, wire env vars locally.
- Implement `/api/onboarding` → save assessment + generate “You Report” (can stub Anthropic response initially).
- Implement `/api/chat/stream` → basic streaming using Anthropic; store messages in Supabase.
- Update web/mobile clients to use the real APIs via `packages/api-client`.

## Future Yourself Notes
- When concurrency or launches demand it, drop in the Chat Gateway (see docs) and just flip `CHAT_GATEWAY_URL`.
- Payments/analytics are intentionally deferred—add them only after the core loop is validated.
- Keep an eye on LLM costs; distilled memory + capped context are non-negotiable once real data flows.
