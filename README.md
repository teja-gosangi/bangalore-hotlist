# Bangalore Hot List

Nomination + voting microsite for Meant2Bae (Vite, React, TypeScript, Supabase).

## Setup

### 1. New Supabase project

Create a fresh Supabase project (not the Dashboard project).

Run migrations in order in the Supabase SQL Editor:

1. `supabase/migrations/001_nominations.sql`
2. `supabase/migrations/002_lock_down_votes.sql` — fixes vote stuffing on insert
3. `supabase/migrations/003_rate_limit.sql` — **only after** Edge Function is deployed (see below)

### 2. Edge Function (rate limit)

Nominations go through `submit-nomination` (3 per IP / hour, 10 / day).

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy submit-nomination
```

Or in Supabase Dashboard → Edge Functions → deploy `supabase/functions/submit-nomination/index.ts`.

**Important:** Deploy the function **before** running `003_rate_limit.sql`, which removes direct anon inserts.

### 3. Environment

Copy `.env.example` to `.env.local` and fill in:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL` (optional, for share links)

### 4. Local dev

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
