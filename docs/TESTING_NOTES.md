# Testing Notes

> ⚠️ Do not record real API keys or passwords in test docs. Always use placeholders in examples.

## Environment Setup

1. Install dependencies (once):
   ```bash
   pnpm install
   ```

2. Start the web (Next.js) app:
   ```bash
   pnpm dev:web
   ```
   The app runs at http://localhost:3000 and serves all Supabase-backed endpoints used by mobile.

3. Start the Expo app in a separate terminal:
   ```bash
   pnpm dev:mobile
   ```
   - Expo CLI shows a QR code.
   - For physical devices, ensure `EXPO_PUBLIC_API_BASE_URL` points to your machine's LAN IP (e.g. `http://192.168.x.x:3000`) before running the command.
   - For simulators, `http://localhost:3000` is fine.

4. Environment variables:
   - Web: `.env.local` (already contains Supabase + Anthropic keys and `CHAT_SYSTEM_PROMPT`).
   - Mobile: `apps/mobile/.env` (mirrors `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_BASE_URL`).

## Creating Test Accounts

Supabase treats each unique email as a distinct user. To reuse a single inbox while generating new accounts:

- Use plus-tagging (supported by Gmail and many providers). Example:
  - Base inbox: `tester@example.com`
  - Variants: `tester+run01@example.com`, `tester+run02@example.com`, `tester+run03@example.com`
- For a concrete pattern with `connorholly11@gmail.com`:
  - `connorholly11+run01@gmail.com`
  - `connorholly11+run02@gmail.com`
  - `connorholly11+run03@gmail.com`
- Each variation receives the OTP in the same inbox but counts as a unique Supabase user.
- To reset an account, delete it in the Supabase Dashboard (Authentication → Users) or via the API if needed.

## Onboarding & Chat Smoke Test

1. Open the web app at http://localhost:3000.
2. Walk through onboarding, using a plus-tagged email in the account step.
3. After completion, confirm:
   - Personal Insights report appears in chat and in `/reports/personal-insights`.
   - Supabase tables (`profiles`, `assessments`, `chat_messages`, `reports`) contain the data.
4. Send a chat message; verify Anthropic response (<30s) and persistence in Supabase.

## Mobile Smoke Test

1. In Expo Go (or simulator), sign in with the same plus-tagged email.
2. Verify:
   - OTP sign-in completes.
   - Chat history loads and matches web session.
   - Sending a message yields a non-streaming Anthropic reply and writes to Supabase (`chat_messages`).

## Quests & Journey Checks

1. Web: run through a quest via `/quests`.
2. Confirm `quests_progress` shows the completion and `/journey` reflects updated stats.
3. Optional: call `/api/quests` manually (curl or REST client) to inspect JSON payload.

## Unit Tests

Run `pnpm test:run` from the repo root to validate:
- Personal insights generation/parsing
- Onboarding payload/reflection validation (Zod schemas)
- API client streaming/event handling
- Next.js API routes for onboarding and chat (Supabase/Anthropic mocked, includes error coverage)

## Regression Checklist

- [ ] Web onboarding + report generation
- [ ] Web chat streaming response (token + final events)
- [ ] Mobile chat non-streaming response
- [ ] Quest completion persists
- [ ] Journey metrics update
- [ ] Supabase dashboard shows expected rows for user
- [ ] Anthropic prompt matches `CHAT_SYSTEM_PROMPT`

## Clean-Up Tips

- Use Supabase dashboard to delete test users when done.
- If Anthropic or Supabase env vars change, update both `.env.local` and `apps/mobile/.env`.
- After dependency upgrades, rerun:
  ```bash
  pnpm --filter web lint
  pnpm --filter mobile typecheck
  ```
