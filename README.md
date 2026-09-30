# Emotional Map

An interactive, private-first memory map for collecting the places, photographs, stories, and emotions that shape us.

**Live demo:** [emotional-map-xuexiaoyan.netlify.app](https://emotional-map-xuexiaoyan.netlify.app)

## Highlights

- Create photo memories with place search, coordinates, story, emotion, and privacy controls.
- Browse memories on an editorial, watercolor-inspired interactive map.
- Share a public map or individual public memories without requiring visitors to sign in.
- Keep private media in a private Supabase Storage bucket, delivered through an authorized server route.
- Email-based authentication, public/private memory access control, and responsive desktop/mobile layouts.

## Tech stack

- Next.js 16, React 19, TypeScript
- Prisma with PostgreSQL / Supabase
- Supabase Storage and Auth
- Leaflet / React Leaflet
- Netlify deployment

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Environment variables and credentials are intentionally excluded from this repository. See `.env.example` for the required variable names.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Notes

The project is designed so that public memories can be shared safely, while private memories and their original photos remain accessible only to the owner.
