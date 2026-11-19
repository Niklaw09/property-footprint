// Stripe webhook: grants the 12-month entitlement when a Checkout Session is paid.
// In Stripe: Developers -> Webhooks -> Add endpoint
//   URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
//   Events: checkout.session.completed, checkout.session.async_payment_succeeded
// Secrets: STRIPE_WEBHOOK_SECRET (whsec_...), plus SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (automatic).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { createService } from '../_shared/service.ts';
import { parseSession, verifyStripeSignature } from '../_shared/stripe.ts';
import { supabaseStore } from './supabaseStore.ts';const env = (k: string) => Deno.env.get(k) ?? '';
const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const service = createService({ store: supabaseStore(db), engine: () => ({ provider: null }), priceCents: Number(env('PRICE_CENTS')) || 1999 });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  const raw = await req.text();
  if (!(await verifyStripeSignature(raw, req.headers.get('stripe-signature'), env('STRIPE_WEBHOOK_SECRET')))) {
    return new Response('bad signature', { status: 400 });
  }
  const event = JSON.parse(raw);
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const s = parseSession(event.data.object);
    if (s.paid && s.userId && s.reportId) {
      try {
        await service.grantPurchase({ userId: s.userId, reportId: s.reportId, sessionId: s.id, amountCents: s.amountCents });
      } catch (e) {
        console.error('grant failed', e);
        return new Response('grant failed', { status: 500 }); // Stripe retries
      }
    }
  }
  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});

