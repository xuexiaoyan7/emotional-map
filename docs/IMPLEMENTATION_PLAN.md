# Implementation plan

## Phase 0 — Discovery and architecture

Complete: inspect an empty workspace and available Node/npm/pnpm environment; choose the modular-monolith architecture; document services, schema direction, routes, environment variables, and account-dependent integrations in `ARCHITECTURE.md`.

## Phase 1 — Core local MVP

**Status: complete.** The original opaque migration error was caused by Prisma CLI not passing `DATABASE_URL` from its automatic `.env` load to this host’s schema-engine child process. [`prisma.config.ts`](../prisma.config.ts) explicitly configures the datasource, and [`scripts/prisma.sh`](../scripts/prisma.sh) explicitly exports local variables before each Prisma command. Migration `20260917081950_init` now applies successfully with real SQLite, and Prisma Client is generated.

1. Establish the Next.js, TypeScript, lint, typecheck, and test baseline.
2. Add Prisma schema, SQLite migration, emotion seed vocabulary, and repositories.
3. Build development OTP/session auth with an explicit development-only code.
4. Build one-photo upload and local storage adapter with validation and retryable errors.
5. Build the five-step Add a Memory flow: confirmed/manual place, multiple feelings with 1–10 intensity and optional custom expression, story, and private-by-default visibility.
6. Save and show memories on a basic accessible map; add memory detail and meaningful empty/error states.
7. Run lint, typecheck, unit tests, production build, and a manual desktop/mobile smoke test.

Implemented: signed development OTP session; local single-photo upload with file/type/size validation; client EXIF attempt; development city coordinate fallback; a five-step accessible recording flow; canonical emotion seeding; private-by-default records; Leaflet Footprints/Emotion modes; random-memory card; owner detail, edit, and confirmed deletion. `npm run test:phase1` exercises the server endpoints against the running local app and cleans its test record afterward.

## Phase 2 — Public reading and light interaction

Public-map routes, visibility authorization, comments, likes, configurable reactions, and owner-only aggregate interaction counts. Guests may read public content but are sent to login before participation.

## Phase 3 — Editorial experience and production adapters

Location-story layouts, emotional map mode/filtering, restrained traces and reduced-motion behavior. Add production-grade Postgres, object storage, SMS, MapTiler/MapLibre and geocoding adapters only after credentials exist.

## Definition of done per phase

No phase advances with known lint/type/build failures. Core actions need loading, empty, error and keyboard-accessible states. New external services remain optional and explicit; they must never prevent manual recording.
