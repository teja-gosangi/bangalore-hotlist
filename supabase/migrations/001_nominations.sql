-- Run once in your new Supabase project: SQL Editor → New query → paste → Run

create table public.nominations (
  id uuid primary key default gen_random_uuid(),
  nominee_name text not null,
  gender text not null check (gender in ('man', 'woman', 'other')),
  twitter_or_linkedin text not null,
  reason text not null,
  nominator_name text not null,
  votes integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index nominations_status_votes_idx on public.nominations (status, votes desc);

alter table public.nominations enable row level security;

-- Anyone can nominate (insert only as pending)
create policy "anon_insert_pending_nominations"
  on public.nominations
  for insert
  to anon
  with check (status = 'pending');

-- Anyone can read approved nominees (vote list)
create policy "anon_select_approved_nominations"
  on public.nominations
  for select
  to anon
  using (status = 'approved');

-- Vote via RPC only (no direct UPDATE for anon)
create or replace function public.vote_for_nominee(nominee_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Keep in sync with src/constants.ts (VOTING_START / VOTING_END)
  voting_start timestamptz := '2026-09-05T05:00:00+05:30';
  voting_end timestamptz := '2026-09-06T17:00:00+05:30';
begin
  if now() < voting_start or now() >= voting_end then
    raise exception 'Voting is not open';
  end if;

  update public.nominations
  set votes = votes + 1
  where id = nominee_id and status = 'approved';

  if not found then
    raise exception 'Nominee not found or not approved';
  end if;
end;
$$;

grant execute on function public.vote_for_nominee(uuid) to anon;
