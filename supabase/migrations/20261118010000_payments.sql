-- $19.99 per home: a paid entitlement unlocks the full report, tracking and twice-monthly re-checks for 12 months.
create table public.entitlements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  session_id text not null unique, -- Stripe Checkout Session id; makes webhook retries idempotent
  amount_cents integer not null,
  paid_at timestamptz not null default now(),
  paid_until timestamptz not null
);
create index entitlements_user_report_idx on public.entitlements(user_id, report_id, paid_until desc);
alter table public.entitlements enable row level security;
