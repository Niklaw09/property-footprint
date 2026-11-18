-- Property Footprint v2 schema.
-- All tables have RLS enabled with no policies: browsers never read them directly.
-- Every read and write goes through the `api` Edge Function (service role), which enforces
-- what an anonymous visitor may see (counts + one preview) versus a signed-in member.

create extension if not exists pgcrypto;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  address_key text not null unique,
  address jsonb not null,
  display text not null,
  created_at timestamptz not null default now(),
  last_scanned_at timestamptz,
  next_scan_at timestamptz,
  scan_count integer not null default 0,
  last_status text not null default 'pending' check (last_status in ('pending', 'ok', 'failed')),
  checks jsonb not null default '[]'::jsonb
);

create table public.findings (
  report_id uuid not null references public.reports(id) on delete cascade,
  fid text not null,
  data jsonb not null,
  preview boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  still_found boolean not null default true,
  gone_verified_at timestamptz,
  primary key (report_id, fid)
);
create index findings_report_idx on public.findings(report_id);

-- One-time tokens handed to the anonymous browser that ran the scan; exchanged for membership after sign-in.
create table public.claim_tokens (
  token_hash text primary key,
  report_id uuid not null references public.reports(id) on delete cascade,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create table public.memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  created_at timestamptz not null default now(),
  monitor boolean not null default true,
  owner_name text not null default '',
  primary key (user_id, report_id)
);

create table public.tasks (
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  fid text not null,
  status text not null default 'todo' check (status in ('todo', 'sent', 'waiting', 'removed', 'cant')),
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, report_id, fid)
);

create table public.scan_runs (
  id bigint generated always as identity primary key,
  report_id uuid not null references public.reports(id) on delete cascade,
  kind text not null check (kind in ('initial', 'refresh', 'manual', 'scheduled')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  found integer not null default 0,
  new_count integer not null default 0,
  gone_count integer not null default 0,
  diagnostics jsonb
);
create index scan_runs_report_idx on public.scan_runs(report_id, started_at desc);

-- Abuse and cost control: per-IP buckets and a site-wide daily cap. Counted only for scans that hit the search API.
create table public.rate_buckets (
  bucket text primary key,
  count integer not null default 0,
  expires_at timestamptz not null
);

alter table public.reports enable row level security;
alter table public.findings enable row level security;
alter table public.claim_tokens enable row level security;
alter table public.memberships enable row level security;
alter table public.tasks enable row level security;
alter table public.scan_runs enable row level security;
alter table public.rate_buckets enable row level security;

-- Atomic increment used for rate limiting. Returns the new count.
create or replace function public.bump_bucket(p_bucket text, p_ttl_seconds integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v integer;
begin
  delete from rate_buckets where expires_at < now();
  insert into rate_buckets(bucket, count, expires_at)
  values (p_bucket, 1, now() + make_interval(secs => p_ttl_seconds))
  on conflict (bucket) do update set count = rate_buckets.count + 1
  returning count into v;
  return v;
end;
$$;
revoke all on function public.bump_bucket(text, integer) from public, anon, authenticated;

-- Re-checks (every 15 days for paid homes): pg_cron calls the api function every hour; it picks up reports whose next_scan_at has passed.
-- Enable the pg_cron and pg_net extensions in the Supabase dashboard, then run (replace the placeholders):
--
--   select cron.schedule('property-footprint-rescan', '17 * * * *', $$
--     select net.http_post(
--       url := 'https://<project-ref>.supabase.co/functions/v1/api',
--       headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
--       body := '{"action":"cron"}'::jsonb
--     );
--   $$);
