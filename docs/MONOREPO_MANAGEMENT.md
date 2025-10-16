# Monorepo Management Cheatsheet

## Install & Bootstrap

```bash
pnpm install
```

This installs dependencies for all apps and packages. The lockfile should be committed after any dependency updates.

## Development Commands

```bash
pnpm dev:web      # Next.js web app
pnpm dev:mobile   # Expo dev server (press 'i' to open iOS simulator)
```

## Linting & Typechecking

```bash
pnpm lint:web
pnpm lint:mobile
pnpm --filter mobile typecheck
```

Lint/format rules live alongside each app (see `apps/web/eslint.config.mjs` and Expo defaults).

## Directory Conventions

- `apps/web`: Next.js project (deployed to Vercel)
- `apps/mobile`: Expo React Native project
- `packages/*`: shared libraries (API client, design tokens, analytics helpers)

Shared packages should be authored in TypeScript with exports from `src/index.ts`. Consumers import via the `@purpose/*` namespace.

- `@purpose/api-client` already backs both platforms (Supabase typings, onboarding schemas, chat helpers). Update this package first when adjusting shared flows.
- `@purpose/ui` and `@purpose/analytics` are reserved placeholders. Leave them empty or add throwy exports until we land reusable components/telemetry.

## Adding Shared Code

1. Place reusable modules in `packages/api-client`, `packages/ui`, or `packages/analytics`.
2. Export from `src/index.ts`.
3. Re-run `pnpm install` if new dependencies are added to packages.
4. Import via `@purpose/api-client`, etc., in both apps.

## Handling Environment Variables

- Web: define in `apps/web/.env.local` (see Next.js docs).
- Mobile: Expo uses `.env` with `@expo/env` or inline config in `app.config.ts`. Document shared keys in `docs/IMPLEMENTING_SUPABASE_ANTHROPIC.md`.

## Dependency Updates

- Add dependencies inside the relevant app/package (`pnpm --filter web add ...`).
- Commit both `package.json` and the updated `pnpm-lock.yaml`.

## Production Builds

```bash
pnpm --filter web build   # Next.js
pnpm --filter mobile start -- --no-dev # production preview for Expo (EAS build recommended)
```

For mobile distribution use Expo Application Services (EAS) once the project is ready.
