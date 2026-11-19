/*
# Launch offer and reviews

1. Modified Tables
- `entitlements`
  - `lang` (text, not null, default 'en') — the language the purchase was made in.
  - `review_email_sent_at` (timestamptz, nullable) — when the post-purchase review invitation email was sent.
  - Partial index on `paid_at` for rows where the review email has not been sent yet (used by the email-sending job).

2. New Tables
- `reviews` — optional on-site reviews, one per account (user_id is the primary key). Rating 1-5, free-text comment, and the report it relates to (nullable, kept if the report is deleted).

3. Security
- RLS is ENABLED on `reviews` with NO policies: browsers never read it directly.
- All reads/writes go through the `api` Edge Function using the service role.
- The free-unlock promo counters reuse the existing `rate_buckets` table via the atomic `bump_bucket()` function; no new tables are needed for the offer.

4. Notes
- Fully idempotent: `add column if not exists`, `create index if not exists`, `create table if not exists`.
*/

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
