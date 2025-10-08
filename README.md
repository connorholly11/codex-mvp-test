# Purpose Monorepo

This repository now houses the Purpose web experience (Next.js) and the in-progress Expo/React Native iOS client, along with shared packages.

## Structure

```
apps/
  web/        # Next.js web app (current prototype)
  mobile/     # Expo React Native app (base chat scaffold)
packages/
  api-client/ # Placeholder for shared Supabase/Anthropic helpers
  analytics/  # Placeholder for shared analytics helpers
  ui/         # Placeholder for shared design tokens/components
```

## Getting Started

Install dependencies (from repo root):

```bash
pnpm install
```

### Web

```bash
pnpm dev:web        # runs Next.js dev server inside apps/web
pnpm lint:web       # lint the web app
```

### Mobile (Expo)

```bash
pnpm dev:mobile     # starts Expo in development mode
pnpm --filter mobile ios   # optional alias to open iOS simulator
```

> The mobile app currently contains a minimal chat screen to validate Expo tooling. Supabase/Anthropic integration and shared packages will plug in here as they are built out.

## Shared Packages

- `@purpose/api-client`, `@purpose/ui`, `@purpose/analytics` are placeholders for cross-platform logic. As the backend is wired up, move shared Supabase APIs, design tokens, and analytics helpers into these packages so both apps stay in sync.

## Next Steps

1. Fill the shared packages with real implementations (Supabase clients, tokens, analytics).
2. Wire the Expo app to the same Supabase/Anthropic endpoints as the web app.
3. Add platform-specific polish (haptics, voice input/output, push notifications) to the mobile client.

Refer to `docs/IMPLEMENTING_SUPABASE_ANTHROPIC.md` for the Supabase/Anthropic rollout plan.
