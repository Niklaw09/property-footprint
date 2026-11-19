# Project memory

## Product intent & audience

- Web app with a scanning/search feature that queries external search providers (Serper or Brave) and returns results via a Supabase Edge Function API.
- Monetized via Stripe checkout; payment completion recorded through a Stripe webhook edge function.
- Hourly re-check cron job for recurring scans (must be scheduled manually in Supabase dashboard).

## Brand personality & voice

- No explicit voice guidance inferred yet.

## Visual design & UX direction

- Frontend: Vite + React. No specific design tokens, layout, or component patterns inferred from current context.

## Decisions, constraints & rationale

- **Database access pattern:** All 8 tables have RLS enabled; the app never touches the DB directly from the client — all access flows through the `api` edge function.
- **Edge function bundler limitation:** Cross-function imports outside `_shared` are not bundled. Additionally, the bundler does not include `_shared` files for a changed function's deploy — shared DB-access code must be **inlined per function**. This was discovered when `stripe-webhook` couldn't resolve `../api/supabaseStore.ts`; fix was to duplicate the store file into each function's own directory.
- **Deploy tooling:** Supabase deploy change-detection can be stale; touching source files forces a redeploy when needed.
- **Migrations:** Schema-init and payments-table migrations were already applied; no re-run needed.

## Open questions & assumptions

- Exact purpose of scans / what is being tracked (rank? availability? price?) not yet confirmed.
- Search provider choice (Serper vs Brave) and API key configuration still pending — scanning returns no live results until a key is set.
- Hourly cron job not yet scheduled in Supabase dashboard (manual step per migration notes).
- No `.bolt/prompt` authored yet; no explicit brand, voice, or design directives exist.