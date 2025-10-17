# Purpose Monorepo

This repository now houses the Purpose web experience (Next.js) and the in-progress Expo/React Native iOS client, along with shared packages.

> **Focus:** Mobile-first. Treat the web app as feature-frozen unless there’s an explicit request.

## Structure

```
apps/
  web/        # Next.js web app (current prototype)
  mobile/     # Expo React Native app (base chat scaffold)
packages/
  api-client/ # Shared Supabase/Anthropic client consumed by web + mobile
  analytics/  # Lightweight event buffer shared by web + mobile
  ui/         # Stub package reserved for future design tokens/components
```

## Getting Started

Install dependencies (from repo root):

```bash
pnpm install
```

### Mobile (Expo)

```bash
pnpm dev:mobile     # starts Expo in development mode
pnpm --filter mobile ios   # optional alias to open iOS simulator
```

> The Expo app is the product’s primary surface. Prioritize bringing feature parity with web using the shared packages before extending the web experience.

### Web

```bash
pnpm dev:web        # runs Next.js dev server inside apps/web
pnpm lint:web       # lint the web app
```

## Shared Packages

- `@purpose/api-client` contains the shared onboarding schemas, chat helpers, quest/report utilities, and Supabase typings used by both apps.
- `@purpose/analytics` ships a simple event buffer so the surfaces can log milestones in a consistent way (persists to `localStorage` in dev).
- `@purpose/ui` remains a stub until we promote reusable UI primitives.

## Next Steps

1. Follow `docs/MOBILE_PARITY_PLAN.md` for remaining mobile polish (subscriptions, notifications cadence, voice prep).
2. Keep shared packages authoritative—implement new logic once in `@purpose/api-client` / `@purpose/analytics` and consume from web/mobile.
3. Avoid net-new web changes unless they’re blocking mobile delivery or explicitly requested.

Refer to `docs/IMPLEMENTING_SUPABASE_ANTHROPIC.md` for backend context and `docs/MOBILE_PARITY_PLAN.md` for mobile delivery details.
