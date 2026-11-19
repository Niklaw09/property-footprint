-- Launch offer and reviews.
-- The free-unlock counter lives in rate_buckets ('promo:launch' and 'promo:user:<id>'), bumped atomically by bump_bucket().

alter table public.entitlements add column if not exists lang text not null default 'en';
alter table public.entitlements add column if not exists review_email_sent_at timestamptz;
create index if not exists entitlements_review_email_idx on public.entitlements(paid_at) where review_email_sent_at is null;

-- Optional on-site reviews, one per account. Never required for, or tied to, any offer.
create table if not exists public.reviews (
  user_id uuid primary key references auth.users(id) on delete cascade,
  report_id uuid references public.reports(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
