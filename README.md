# Purpose Monorepo

This repository now houses the Purpose web experience (Next.js) and the in-progress Expo/React Native iOS client, along with shared packages.

> **Focus:** We are mobile-first. Web work should be explicitly requested or tagged before you dive in.

## Structure

```
apps/
  web/        # Next.js web app (current prototype)
  mobile/     # Expo React Native app (base chat scaffold)
packages/
  api-client/ # Shared Supabase/Anthropic client consumed by web + mobile
  analytics/  # Stub package reserved for future cross-platform analytics
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

- `@purpose/api-client` contains the shared onboarding schemas, chat helpers, and Supabase typings that power both Next.js and Expo clients today.
- `@purpose/ui` and `@purpose/analytics` are intentionally empty until we have reusable components/telemetry; keep them stubbed so imports fail fast while we shape those packages.

## Next Steps

1. Follow `docs/MOBILE_PARITY_PLAN.md` to close the gap between the Expo app and the current web experience (onboarding, quests, reports, streaming chat).
2. Fill the shared packages with reusable implementations (`@purpose/api-client`, `@purpose/ui`, `@purpose/analytics`) so both platforms stay in lockstep.
3. Layer mobile-specific polish (RevenueCat subscriptions, push notifications, voice) once parity milestones are met.

Refer to `docs/IMPLEMENTING_SUPABASE_ANTHROPIC.md` for backend context and `docs/MOBILE_PARITY_PLAN.md` for mobile delivery details.
