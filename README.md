# Bangalore Hot List

Nomination + voting microsite for Meant2Bae (Vite, React, TypeScript, Supabase).

## Setup

### 1. New Supabase project

Create a fresh Supabase project (not the Dashboard project).

Run the SQL in `supabase/migrations/001_nominations.sql` in the Supabase SQL Editor.

### 2. Environment

Copy `.env.example` to `.env.local` and fill in:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL` (optional, for share links)

### 3. Local dev

```bash
npm install
npm run dev
```

- `/` — nominations (always live)
- `/vote` — voting list (gated by schedule + approved rows)

## Voting schedule

Edit `src/constants.ts` and the dates inside `vote_for_nominee()` in the SQL migration (keep them in sync):

- **Start:** Sat 5 Sep 2026, 5:00 AM IST
- **End / final list:** Sun 6 Sep 2026, 5:00 PM IST (36 hours)

## Admin

No admin UI. In Supabase Table Editor, set `status` to `approved` for nominees who should appear on `/vote`. Reject others with `rejected`.

## Deploy (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Add the same `VITE_*` env vars
4. `vercel.json` handles SPA routing

Point `hotlist.meant2bae.com` via Cloudflare when ready.
