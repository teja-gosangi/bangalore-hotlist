-- Rate limiting for nominations (used by submit-nomination Edge Function)
-- Also blocks direct anon inserts — nominations must go through the function.

create table if not exists public.nomination_rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists nomination_rate_limits_ip_created_idx
  on public.nomination_rate_limits (ip_hash, created_at desc);

alter table public.nomination_rate_limits enable row level security;

-- No policies: only service role (Edge Function) can read/write.

drop policy if exists "anon_insert_pending_nominations" on public.nominations;

-- anon can no longer insert directly; use submit-nomination Edge Function instead.
