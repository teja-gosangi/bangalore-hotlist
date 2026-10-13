# Bangalore Hot List

Nomination + voting microsite for Meant2Bae (Vite, React, TypeScript, Google Sheets).

## Setup

### 1. Google Sheet

Create a spreadsheet named **Bangalore Hot List Nominations** with two tabs:

- `Nominations` — headers: `id`, `created_at`, `status`, `nominee_name`, `gender`, `twitter_or_linkedin`, `reason`, `nominator_name`, `votes`
- `RateLimits` — headers: `ip_hash`, `created_at`

Set a nominee’s `status` to `approved` for them to appear on `/vote`. Use `rejected` to hide them.

### 2. Apps Script webhook

In the sheet: **Extensions → Apps Script**. Paste `sheets/Code.gs`.

**Project Settings → Script properties:** `WEBHOOK_SECRET` (same value as Vercel `SHEETS_WEBHOOK_SECRET`).

**Deploy → New deployment → Web app**

- Execute as: **Me**
- Who has access: **Anyone**

Copy the web app URL into Vercel as `SHEETS_WEBHOOK_URL`.

Nominations go through `/api/nominate` (3 per IP / hour, 10 / day).

### 3. Environment

Copy `.env.example` to `.env.local` and fill in:

- `VITE_SITE_URL` (optional, for share links)
- `SHEETS_WEBHOOK_URL`
- `SHEETS_WEBHOOK_SECRET`
- `RATE_LIMIT_SALT` (optional)

### 4. Local dev

```bash
npm install
npm run dev
```

API routes (`/api/*`) need `npx vercel dev` (or a deployed webhook) to write to Sheets.

- `/` — nominations (always live)
- `/vote` — voting list (gated by schedule + approved rows)

## Voting schedule

Edit `src/constants.ts` and the dates inside `sheets/Code.gs` (keep them in sync):

- **Start:** Sat 5 Sep 2026, 5:00 AM IST
- **End / final list:** Sun 6 Sep 2026, 5:00 PM IST (36 hours)

## Deploy (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Add `SHEETS_WEBHOOK_URL`, `SHEETS_WEBHOOK_SECRET`, and optional `VITE_SITE_URL` / `RATE_LIMIT_SALT`
4. `vercel.json` handles SPA routing and `/api/*`

Point `hotlist.meant2bae.com` via Cloudflare when ready.
