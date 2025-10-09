# Start Here

## One-Sentence Status
Web onboarding and chat now persist to Supabase and stream replies from Anthropic; mobile app uses shared API client with automatic dev/prod URL switching; deployed to Vercel production.

## Deployments
- **Web (Next.js → Vercel):** https://codex-mvp-test-8gl8n4uly-connor-hollys-projects.vercel.app
- **Mobile (Expo iOS sandbox):** Run locally with Expo Go; iOS is the only supported target for now (Android build is TBD).

## Install & Run
```bash
pnpm install
pnpm dev:web        # http://localhost:3000 (Next.js)
pnpm dev:mobile     # Expo dev server (iOS via Expo Go; signs in with Supabase magic codes)
```

> ⚠️ Never commit real API keys, passwords, or tokens to Git. Keep actual values in local `.env*` files only.

Set these environment variables (store the **real** values in `.env`, `.env.local`, `.env.production`, and Expo `.env`):
```bash
NEXT_PUBLIC_SUPABASE_URL=<YOUR_SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>
SUPABASE_DB_PASSWORD=<YOUR_SUPABASE_DATABASE_PASSWORD>
ANTHROPIC_API_KEY=<YOUR_ANTHROPIC_API_KEY>
CHAT_SYSTEM_PROMPT="You are an AI coach. Speak with compassionate candor..."    # optional override

# Expo (mobile) - automatically switches between dev/prod
EXPO_PUBLIC_SUPABASE_URL=<YOUR_SUPABASE_URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
EXPO_PUBLIC_API_BASE_URL_DEV=http://localhost:3000
EXPO_PUBLIC_API_BASE_URL_PROD=<YOUR_PRODUCTION_SITE_URL>
```

## Tests
```bash
pnpm test           # watch mode
pnpm test:run       # CI-friendly single run
```
The current suite covers:
- Personal insights generation/parsing
- Onboarding payload/reflection schemas (Zod)
- Shared API client streaming/parsing helpers
- Next.js API routes (`/api/onboarding`, `/api/chat/respond`) with mocked Supabase + Anthropic (success + error paths)

## Supabase Setup

**✅ Already Configured (replace with your project specifics):**
- Project: `<YOUR_SUPABASE_PROJECT_NAME>` (ref: `<YOUR_SUPABASE_PROJECT_REF>`)
- Dashboard: https://supabase.com/dashboard/project/<YOUR_SUPABASE_PROJECT_REF>
- Project URL: https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co
- Linked to this repo (see `supabase/.temp`)

**Environment Variables:**
Keep real credentials in `.env` and `.env.local` (never in Git). Example placeholders:
```bash
# Anthropic (for AI chat/reports)
ANTHROPIC_API_KEY=<YOUR_ANTHROPIC_API_KEY>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=<YOUR_SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>
SUPABASE_DB_PASSWORD=<YOUR_SUPABASE_DATABASE_PASSWORD>
```

**Schema Management Workflow:**
We use **SQL migrations via Supabase CLI** (no ORM required for schema):

1. Create a new migration:
   ```bash
   supabase migration new add_table_name
   ```
2. Write SQL in `supabase/migrations/XXXXXXXX_add_table_name.sql`
3. Apply to linked cloud project:
   ```bash
   supabase db push --linked
   ```
4. Commit the migration file to Git

**Data Access:**
- Next.js API routes use the authenticated Supabase client (RLS enforced)
- Shared API helpers live in `packages/api-client` (see `src/web.ts`)
- Anthropic streaming is handled in `/api/chat/stream` with SSE token events (`ack`, `token`, `final`, `done`)

## MVP Tech Stack (current)
- **Web:** Next.js 15 (App Router) → Vercel
  - Production: https://codex-mvp-test-8gl8n4uly-connor-hollys-projects.vercel.app
- **Mobile:** Expo React Native (auto-switches between localhost dev and Vercel prod)
- **Backend services:** Supabase Postgres/Auth; Anthropic for chat/report generation
- **Optional early:** Sentry for error tracking
- **Deferred:** Stripe/RevenueCat paywalls, PostHog analytics, dedicated Chat Gateway (enable when sustained streaming concurrency > ~600)

## Where to Build Next
1. **Mobile parity follow-ups** – the Expo app now signs in and chats against Supabase/Anthropic. Next steps are polishing UX (deep linking, push, offline) and wiring additional surfaces (quests, journey) when needed.
2. **Quests & Journey** – both views hydrate from Supabase today; expand analytics and timeline visuals as new data arrives.
3. **Reports UI** – personal insights viewer loads from Supabase; extend to weekly/monthly reports when those backends ship.
4. **Testing** – add Vitest/Playwright coverage for `/api/onboarding`, `/api/chat/*`, and the new quests endpoints (mock Anthropic+Supabase where possible).

## Useful Docs
- `IMPLEMENTING_SUPABASE_ANTHROPIC.md` (root): architecture + scaling notes (now partially complete).
- `docs/IMPLEMENTING_SUPABASE_ANTHROPIC.md`: long-form reference for auth, streaming, and future phases.
- `docs/MONOREPO_MANAGEMENT.md`: pnpm workspace commands/conventions.

## Status Checklist
- ✅ Supabase schema + migrations applied (including quest progress indexes)
- ✅ Web onboarding submits to Supabase, seeds initial chat + report
- ✅ Web chat streams via Anthropic (SSE) with configurable system prompt + Sonnet 3.5
- ✅ Expo mobile app signs in (email OTP) and chats via Supabase/Anthropic (non-streaming endpoint)
- ✅ Quests/Journey hydrate from Supabase (no local storage persistence remains)
- ✅ Deployed to Vercel production with environment-based URL switching
- 🔜 Broaden automated tests + add additional report/quest analytics once backends are ready

## Future Notes
- Add Supabase RLS migrations enforcing `user_id = auth.uid()` (and session-based policies for chat messages) before onboarding external testers.
- Layer in per-user chat rate limiting/quota once traffic extends beyond internal use.
- Extend the automated test suite (integration coverage for `/api/onboarding`, `/api/chat/*`, quests) before the next feature wave.
- Re-enable dark mode/parity theming once the product surfaces stabilize (currently shipping light mode only).
- Flip the `CHAT_GATEWAY_URL` env once we deploy a dedicated streaming service.
- Add Stripe/RevenueCat + PostHog only after the core loop proves sticky.
- Monitor Anthropic usage; the SSE client already surfaces truncated responses when the 30s cap hits.
