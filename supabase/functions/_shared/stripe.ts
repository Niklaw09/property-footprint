// Minimal Stripe client (REST + webhook signature check) with no SDK, so it runs in Deno and Node.
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function form(obj: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) p.set(k, String(v));
  return p.toString();
}

export interface CheckoutInput {
  secretKey: string;
  priceId?: string; // a Stripe Price; if absent, an inline $amount line item is used
  amountCents: number;
  productName: string;
  successUrl: string; // may contain {CHECKOUT_SESSION_ID}
  cancelUrl: string;
  userId: string;
  reportId: string;
  email?: string;
  locale?: 'en' | 'es';
}

export async function createCheckoutSession(i: CheckoutInput, fetchFn: FetchLike = fetch): Promise<{ id: string; url: string }> {
  const body = form({
    mode: 'payment',
    success_url: i.successUrl,
    cancel_url: i.cancelUrl,
    client_reference_id: i.userId,
    customer_email: i.email,
    locale: i.locale ?? 'auto',
    'metadata[user_id]': i.userId,
    'metadata[report_id]': i.reportId,
    'payment_intent_data[metadata][report_id]': i.reportId,
    'line_items[0][quantity]': 1,
    ...(i.priceId
      ? { 'line_items[0][price]': i.priceId }
      : {
          'line_items[0][price_data][currency]': 'usd',
          'line_items[0][price_data][unit_amount]': i.amountCents,
          'line_items[0][price_data][product_data][name]': i.productName,
        }),
    allow_promotion_codes: 'true',
  });
  const res = await fetchFn('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${i.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`stripe_${res.status}: ${data?.error?.message ?? 'error'}`);
  return { id: data.id, url: data.url };
}

export interface PaidSession {
  id: string;
  paid: boolean;
  userId: string;
  reportId: string;
  amountCents: number;
}

export function parseSession(s: Record<string, any>): PaidSession {
  return {
    id: s.id,
    paid: s.payment_status === 'paid' || s.payment_status === 'no_payment_required',
    userId: s.metadata?.user_id ?? s.client_reference_id ?? '',
    reportId: s.metadata?.report_id ?? '',
    amountCents: Number(s.amount_total ?? 0),
  };
}

export async function getCheckoutSession(secretKey: string, id: string, fetchFn: FetchLike = fetch): Promise<PaidSession> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) throw new Error('bad_session_id');
  const res = await fetchFn(`https://api.stripe.com/v1/checkout/sessions/${id}`, { headers: { Authorization: `Bearer ${secretKey}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(`stripe_${res.status}`);
  return parseSession(data);
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Verify a Stripe-Signature header (t=...,v1=...) over the raw body. Tolerance: 5 minutes. */
export async function verifyStripeSignature(rawBody: string, header: string | null, secret: string, nowSec = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=') as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(nowSec - t) > 300) return false;
  const expected = await hmacHex(secret, `${t}.${rawBody}`);
  const sigs = header.split(',').filter((kv) => kv.startsWith('v1=')).map((kv) => kv.slice(3));
  return sigs.some((s) => safeEqual(s, expected));
}

export { hmacHex as _hmacHexForTests };
