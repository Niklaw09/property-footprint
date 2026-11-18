import { it, expect } from 'vitest';
import { verifyStripeSignature, _hmacHexForTests, createCheckoutSession, parseSession } from '@engine/stripe.ts';

it('verifies Stripe webhook signatures and rejects tampering or stale events', async () => {
  const body = '{"id":"evt_1"}';
  const t = 1_800_000_000;
  const sig = await _hmacHexForTests('whsec_test', `${t}.${body}`);
  expect(await verifyStripeSignature(body, `t=${t},v1=${sig}`, 'whsec_test', t + 10)).toBe(true);
  expect(await verifyStripeSignature(body + ' ', `t=${t},v1=${sig}`, 'whsec_test', t + 10)).toBe(false);
  expect(await verifyStripeSignature(body, `t=${t},v1=${sig}`, 'whsec_other', t + 10)).toBe(false);
  expect(await verifyStripeSignature(body, `t=${t},v1=${sig}`, 'whsec_test', t + 1000)).toBe(false);
  expect(await verifyStripeSignature(body, null, 'whsec_test')).toBe(false);
});

it('creates a $29 checkout with the report in metadata', async () => {
  let sent = '';
  const fake = (async (_u: string, init?: RequestInit) => { sent = String(init?.body); return new Response(JSON.stringify({ id: 'cs_1', url: 'https://checkout.stripe.com/x' })); }) as any;
  const r = await createCheckoutSession({ secretKey: 'sk', amountCents: 2900, productName: 'P', successUrl: 's', cancelUrl: 'c', userId: 'u', reportId: 'r' }, fake);
  expect(r.url).toContain('checkout.stripe.com');
  const p = new URLSearchParams(sent);
  expect(p.get('line_items[0][price_data][unit_amount]')).toBe('2900');
  expect(p.get('metadata[report_id]')).toBe('r');
  expect(p.get('mode')).toBe('payment');
  expect(parseSession({ id: 'cs_1', payment_status: 'paid', metadata: { user_id: 'u', report_id: 'r' }, amount_total: 2900 })).toMatchObject({ paid: true, userId: 'u', reportId: 'r' });
});
