-- Two options per home: the $4.99 Quick scan (full report and guides for 30 days, no re-checks)
-- and the $19.99 12-month plan. Existing rows are 12-month plans.
alter table public.entitlements add column if not exists plan text not null default 'monitor';
alter table public.entitlements drop constraint if exists entitlements_plan_check;
alter table public.entitlements add constraint entitlements_plan_check check (plan in ('quick', 'monitor'));
