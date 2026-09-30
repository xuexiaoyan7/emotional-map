# Emotional Map architecture

## V1 decision

Emotional Map is a Next.js (App Router) application using TypeScript, Prisma and SQLite for the local MVP. This is deliberately a modular monolith: a single deployable application with clear ports for services that need credentials later. It keeps the first useful version inexpensive and easy to operate without closing off a production migration.

## Why this stack

- **Next.js + React:** mature routing, server rendering for public maps, good mobile-web support, and one codebase for UI and server endpoints.
- **Prisma + SQLite locally:** real relational persistence and constraints without asking for an account. Move `DATABASE_URL` to Postgres (recommended: Neon or Supabase) for production; the data model remains relational.
- **Local storage adapter:** saves one uploaded image at a time to a local `uploads/` directory in development. A production object-storage adapter can target Cloudflare R2 or Supabase Storage; neither is implied to be configured.
- **Auth adapter:** UI talks to an OTP/auth service interface rather than an SMS vendor. Development mode shows a clearly labelled mock code; production can use Twilio Verify, Firebase Phone Auth, or a regional provider selected by the owner.

## Map and place strategy

V1 uses React Leaflet. Local development falls back to the standard OpenStreetMap tile service with its required visible attribution and no API key. It is suitable for low-volume individual development, not an unrestricted production tile service. If `NEXT_PUBLIC_MAPTILER_KEY` is configured, the browser switches to MapTiler tiles and displays MapTiler plus OpenStreetMap attribution. Location is stored at place level (`placeName`, `city`, `country`) plus optional coordinates for rendering. Manual search and confirmation are always available.

For production, the recommended map is **MapTiler**: it supports highly customized, low-detail editorial styles and React-friendly MapLibre rendering. It needs a MapTiler account and API key. Production geocoding should use MapTiler Geocoding (or another paid/approved service), behind `GeocodingService`. Nominatim is useful for manual local testing but must not be treated as an unrestricted production API.

## Service boundaries

`src/server/services/` owns interfaces and implementations:

- `auth`: request/verify OTP and create a session
- `storage`: local file and future object storage
- `geocoding`: GPS-to-place and text place search
- `ai-location`: optional photo suggestion only; never blocks saving and never infers emotion/story

Routes and UI depend on these interfaces, not vendor SDKs. No secret is placed in browser code.

## Data model

`User` owns memories. `Memory` belongs to one `Location` and has zero or more `MemoryEmotion` records. `Emotion` is canonical vocabulary; `MemoryEmotion.customExpression` preserves the author’s language. Public/private visibility is enforced on server reads. `Like` has a unique `(userId, memoryId)` constraint. `Reaction` has a unique `(userId, memoryId, kind)` constraint. Comment bodies are public only where their memory is public. Interaction totals are owner-only API data.

Future “Respond with a Memory” can be a new directed relation (`MemoryResponse`) without changing the current models or public-route policy.

## Routes

- `/` — own map (authenticated) or quiet product entry
- `/login` — phone + OTP
- `/memories/new` — five-step record flow
- `/memories/[memoryId]` — memory detail; enforces visibility
- `/places/[locationId]` — owner location story
- `/u/[handle]` — public emotional map
- `/u/[handle]/places/[locationId]` — public location story
- `/api/auth/*`, `/api/memories`, `/api/places/search`, `/api/interactions/*` — server endpoints

## Folder layout

```text
src/app/             route shells and API endpoints
src/components/      accessible reusable UI
src/features/        domain UI and form state (memory, map, auth)
src/lib/             pure shared helpers and configuration
src/server/          Prisma client, repositories, service adapters
prisma/              schema and seed data
docs/                product and engineering decisions
```

## Environment variables

See `.env.example`. Only `DATABASE_URL`, `AUTH_MODE`, `DEV_OTP_CODE`, `SESSION_SECRET`, and `STORAGE_MODE` are useful for the local MVP. The provider variables are placeholders, intentionally unused until their adapters are implemented.

## Required owner actions for production

1. Provision a managed Postgres database (Neon or Supabase recommended).
2. Create an S3-compatible image-storage bucket (Cloudflare R2 or Supabase Storage recommended).
3. Choose/register an SMS vendor and provide server-only credentials.
4. Create a MapTiler account/key and accept its usage terms for the chosen map/geocoding plan.
5. Set production environment variables in the hosting provider (Vercel recommended for the first deployment).

No AI account is required for V1. If introduced later, it must only power optional location suggestions, with user confirmation.
