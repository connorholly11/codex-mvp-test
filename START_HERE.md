# Start Here

## One-Sentence Status
Web onboarding and chat now persist to Supabase and stream replies from Anthropic; mobile app uses shared API client with automatic dev/prod URL switching; deployed to Vercel production.

## Install & Run
```bash
pnpm install
pnpm dev:web        # http://localhost:3000 (Next.js)
pnpm dev:mobile     # Expo dev server (sign-in uses Supabase magic codes)
```

Set these environment variables (see `.env`, `.env.local`, `.env.production`, and Expo `.env`):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://qovxpxqozlcsvynmtham.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_DB_PASSWORD=CodexMVP2025SecurePass!
ANTHROPIC_API_KEY=sk-ant-api03-...
CHAT_SYSTEM_PROMPT="You are an AI coach. Speak with compassionate candor..."    # optional override

# Expo (mobile) - automatically switches between dev/prod
EXPO_PUBLIC_SUPABASE_URL=https://qovxpxqozlcsvynmtham.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
EXPO_PUBLIC_API_BASE_URL_DEV=http://localhost:3000
EXPO_PUBLIC_API_BASE_URL_PROD=https://codex-mvp-test-8gl8n4uly-connor-hollys-projects.vercel.app
```

## Supabase Setup

**✅ Already Configured:**
- Project: `codex-mvp` (ref: `qovxpxqozlcsvynmtham`)
- Dashboard: https://supabase.com/dashboard/project/qovxpxqozlcsvynmtham
- Project URL: https://qovxpxqozlcsvynmtham.supabase.co
- Linked to this repo (see `supabase/.temp`)

**Environment Variables:**
All credentials are in `.env` and `.env.local`:
```bash
# Anthropic (for AI chat/reports)
ANTHROPIC_API_KEY=sk-ant-api03-ZUbtoXFY69elG...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qovxpxqozlcsvynmtham.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_DB_PASSWORD=CodexMVP2025SecurePass!
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
- Flip the `CHAT_GATEWAY_URL` env once we deploy a dedicated streaming service.
- Add Stripe/RevenueCat + PostHog only after the core loop proves sticky.
- Monitor Anthropic usage; the SSE client already surfaces truncated responses when the 30s cap hits.
