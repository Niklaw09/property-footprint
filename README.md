# My Property Footprint

Find every website still showing a home's listing photos, 3D tours, videos and floor plans, and get step-by-step help removing each one.

- **Finding engine**: asks Zillow's and Redfin's own address lookup for the exact property page, then runs ~10 targeted Google searches (via [Serper](https://serper.dev)) across 60+ portals, brokerage/IDX sites, tour hosts, photographer property websites, video and rental sites, plus image and video search.
- **Strict address matching**: every result must match house number + street (+ suffix and directionals) and city or ZIP. Other units in the building, neighbors' pages, maps, people-search and government sites are filtered out. URLs only ever come from a portal or search response; nothing is generated.
- **30 removal playbooks** (English and Spanish) with direct links, contacts, sources and a "checked on" date, plus 5 pre-written request letters (site support, listing agent/MLS, photographer, formal privacy request, uploader).
- **$29 per home (Stripe Checkout)**: a one-time payment unlocks every link, the removal steps and letters, request tracking (to do, sent, waiting, removed, can't remove) and saves the home to the account for 12 months. No subscription. Payment is enforced on the server.
- **Re-checks twice a month**: paid, monitored homes are re-scanned every 15 days for 12 months, plus 2 on-demand scans per 30 days (at least 12 hours apart). Pages that disappear are checked directly (404/410 = verified gone).
- **Locked results enforced on the server**: anonymous visitors get counts and one preview; locked results never include URLs in the response.
- **Abuse protection**: Cloudflare Turnstile bot check on every scan (invisible for most people), plus limits: 3 new scans per device per day without an account, 10 per day per account, 6 per 10 minutes per IP, 25 homes per account and a site-wide daily cap (default 300). Re-scanning an address someone already scanned in the last 24 hours reuses that result, costs nothing and doesn't count. IPs are stored only as salted hashes.
- **Demo mode**: with no backend configured, the app runs the real engine in the browser against a recorded sample (a real Austin home from the accuracy test).

## Run locally

```bash
npm install
npm run dev        # demo mode unless VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set
npm test           # unit tests, including the 10-home accuracy fixtures
```

Live accuracy check against the 10 real homes (costs ~100 Serper queries):

```bash
SERPER_API_KEY=... npx vitest run tests/live-accuracy.test.ts
```

## Deploy

1. **Supabase project**: create one (a fresh project is cleanest), then apply both files in `supabase/migrations/` in order (SQL editor or `supabase db push`).
2. **Auth**: Authentication → Providers → Email: enable. Under URL Configuration add your site URL (for example `https://your-site.netlify.app`) to the redirect allow list.
3. **Edge Functions**: `supabase functions deploy api` and `supabase functions deploy stripe-webhook` (the `supabase/config.toml` turns off the gateway JWT check; `api` verifies users itself and the webhook verifies Stripe's signature).
4. **Secrets**: `supabase secrets set SERPER_API_KEY=... CRON_SECRET=<random string> IP_HASH_SALT=<random string> TURNSTILE_SECRET_KEY=...` (optional `BRAVE_API_KEY`, `SCAN_DAILY_LIMIT`, default 300/day). Create the Turnstile widget (free) in Cloudflare → Turnstile, add your site's domain, and put its site key in `VITE_TURNSTILE_SITE_KEY`.
5. **Stripe**: in the Stripe dashboard → Developers → Webhooks, add the endpoint `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` with events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Then set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (the endpoint's signing secret) and `SITE_URL` (your site's address, used for the return links) as Supabase secrets. Optional: `STRIPE_PRICE_ID` to use a Price from your Stripe catalog, `PRICE_CENTS` (default 2900). Use test-mode keys first.
6. **Re-checks**: enable the `pg_cron` and `pg_net` extensions and run the `cron.schedule(...)` snippet at the bottom of the migration with your project ref and `CRON_SECRET`.
7. **Frontend** (Bolt, Netlify or Vercel): build command `npm run build`, output `dist`, env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_TURNSTILE_SITE_KEY`.

### Bolt

Import this repository with **Import from GitHub**. Bolt's Supabase integration can run the migration and deploy `supabase/functions/api`; add the secrets in the Supabase dashboard (Edge Functions → Secrets).

### Accuracy check on the live server

Open `https://<your-site>/#/selftest` and press **Run accuracy check**. It scans the 10 test homes from the server (so it also shows whether Zillow's and Redfin's lookups work from Supabase), using about 100 search credits. It is limited to 3 runs per day.

### Sign-in emails

Supabase's built-in email sender only allows a few emails per hour. Before real traffic, add a custom SMTP provider (for example Resend) under Authentication → Emails → SMTP.

## Layout

```
supabase/functions/_shared/   engine (shared by the browser demo, tests and the Edge Function)
  address.ts     parsing, normalization, matching
  sites.ts       site registry, ignore list, search groups
  providers.ts   Serper / Brave search, Zillow + Redfin lookups
  engine.ts      queries -> candidates -> verified findings
  playbooks.ts   30 removal playbooks (EN/ES)
  letters.ts     request letter templates (EN/ES)
  service.ts     scans, locked views, claiming, tasks, re-scans
supabase/functions/api/       Edge Function + Postgres store
supabase/migrations/          schema (RLS on, service-role access only)
src/                          React app (Vite + Tailwind)
tests/                        vitest suites and the accuracy fixtures
```

## Keeping playbooks accurate

Each playbook has `status` (`verified`, `researched`, `general`), `checkedOn` and `sources`. Re-check them at least every 90 days; site flows change often.
