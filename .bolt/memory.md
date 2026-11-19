# Project memory

## Product intent & audience

- Web app with a scanning/search feature that queries external search providers (Serper or Brave) and returns results via a Supabase Edge Function API.
- Monetized via Stripe checkout; payment completion recorded through a Stripe webhook edge function.
- Includes a reviews feature: one review per account, 1–5 star rating + comment.
- Hourly re-check cron job for recurring scans (must be scheduled manually in Supabase dashboard).

## Brand personality & voice

- No explicit voice guidance inferred yet.

## Visual design & UX direction

- Frontend: Vite + React. No specific design tokens, layout, or component patterns inferred from current context.

## Decisions, constraints & rationale

- **No git in this environment:** The project folder is not connected to a git repository; git operations (pull, etc.) are unavailable. Code changes are applied directly from disk.
- **Database access pattern:** All tables have RLS enabled; the app never touches the DB directly from the client — all access flows through the `api` edge function. Reviews table follows this same pattern (visitors can't read/write directly).
- **Edge function bundler limitation:** Cross-function imports outside `_shared` are not bundled. Shared DB-access code must be inlined per function.
- **Deploy tooling:** Supabase deploy change-detection can be stale; touching source files forces a redeploy when needed.
- **Migrations:** Schema-init, payments-table, and reviews/purchase-tracking migrations already applied. Purchase records now track language used and whether a review invitation was sent.

## Open questions & assumptions

- Exact purpose of scans / what is being tracked (rank? availability? price?) not yet confirmed.
- Search provider choice (Serper vs Brave) and API key configuration still pending — scanning returns no live results until a key is set.
- Hourly cron job not yet scheduled in Supabase dashboard (manual step per migration notes).
- Review invitation flow (when/how invitations are sent) not yet detailed.
- No `.bolt/prompt` authored yet; no explicit brand, voice, or design directives exist.