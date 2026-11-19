/*
# Two purchase plans: $4.99 Quick scan and $19.99 12-month plan

1. Modified Tables
- `entitlements`
  - `plan` (text, not null, default 'monitor') — which purchase the entitlement is:
    - 'quick': one-time $4.99 Quick scan — full report and guides unlocked for 30 days, no automatic re-checks.
    - 'monitor' (default): $19.99 12-month plan — full report, tracking, and twice-monthly re-checks.
  - Existing rows are treated as 'monitor' (12-month plans) via the default.
  - A check constraint allows only 'quick' or 'monitor'.

2. Security
- No changes to RLS or grants. The table stays locked to the service role (access only through the `api` Edge Function).

3. Notes
- Idempotent: `add column if not exists`, `drop constraint if exists` before re-adding the constraint.
*/

alter table public.entitlements add column if not exists plan text not null default 'monitor';
alter table public.entitlements drop constraint if exists entitlements_plan_check;
alter table public.entitlements add constraint entitlements_plan_check check (plan in ('quick', 'monitor'));
