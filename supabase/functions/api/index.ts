// HomePrint API (Supabase Edge Function, Deno).
// POST /functions/v1/api  { action, ...params }   Authorization: Bearer <user JWT or anon key>
//
// Secrets: SERPER_API_KEY (or BRAVE_API_KEY), CRON_SECRET, TURNSTILE_SECRET_KEY, STRIPE_SECRET_KEY, SITE_URL, optional STRIPE_PRICE_ID, PRICE_CENTS, optional SCAN_DAILY_LIMIT, IP_HASH_SALT.
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { createService, httpVerifier, ServiceError } from '../_shared/service.ts';
import { braveProvider, serperProvider, type SearchProvider } from '../_shared/providers.ts';
import { supabaseStore } from './supabaseStore.ts';
import { verifyTurnstile } from '../_shared/turnstile.ts';
import { runSelftest } from '../_shared/selftest.ts';
import { createCheckoutSession, getCheckoutSession } from '../_shared/stripe.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const env = (k: string) => Deno.env.get(k) ?? '';
const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });

function provider(): SearchProvider | null {
  if (env('SERPER_API_KEY')) return serperProvider(env('SERPER_API_KEY'));
  if (env('BRAVE_API_KEY')) return braveProvider(env('BRAVE_API_KEY'));
  return null;
}

const service = createService({
  store: supabaseStore(db),
  engine: () => ({ provider: provider() }),
  verifyGone: httpVerifier(),
  limits: { perDay: Number(env('SCAN_DAILY_LIMIT')) || 300 },
  ipSalt: env('IP_HASH_SALT') || env('CRON_SECRET'),
  priceCents: Number(env('PRICE_CENTS')) || 1999,
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

const STATUS: Record<ServiceError['code'], number> = {
  invalid_address: 400, payment_required: 402, busy: 429, daily_limit: 429, limit_anon: 429, limit_user: 429, limit_homes: 429, captcha: 403, scan_failed: 502, not_found: 404, forbidden: 403, too_soon: 429,
};

async function userFrom(req: Request): Promise<{ id: string; email?: string } | null> {
  const auth = req.headers.get('Authorization') ?? '';
  const jwt = auth.replace(/^Bearer\s+/i, '');
  if (!jwt || jwt === env('SUPABASE_ANON_KEY')) return null;
  const { data, error } = await db.auth.getUser(jwt);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? undefined };
}

/** Only redirect Stripe back to our own site. */
function safeReturnBase(origin: string | null): string {
  const allowed = (env('SITE_URL') || '').split(',').map((x) => x.trim().replace(/\/$/, '')).filter(Boolean);
  const o = (origin ?? '').replace(/\/$/, '');
  if (allowed.length === 0) return o;
  return allowed.includes(o) ? o : allowed[0];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  let body: Record<string, any>;
  if (req.method === 'GET') {
    body = Object.fromEntries(new URL(req.url).searchParams);
  } else if (req.method === 'POST') {
    try {
      body = await req.json();
    } catch {
      return json({ error: 'bad_json' }, 400);
    }
  } else {
    return json({ error: 'method_not_allowed' }, 405);
  }

  // Accuracy self-test on the 10 public test homes. ~100 search queries, so at most 3 runs per day.
  if (body.action === 'selftest') {
    if (!provider()) return json({ error: 'not_configured' }, 503);
    try {
      const { data: n } = await db.rpc('bump_bucket', { p_bucket: `selftest:${new Date().toISOString().slice(0, 10)}`, p_ttl_seconds: 2 * 86400 });
      if ((n as number) > 3) return json({ error: 'busy', detail: 'selftest_daily_limit' }, 429);
      return json(await runSelftest(() => ({ provider: provider() })));
    } catch (e) {
      console.error('selftest', e);
      return json({ error: 'server_error' }, 500);
    }
  }

  try {
    if (body.action === 'cron') {
      if (!env('CRON_SECRET') || req.headers.get('x-cron-secret') !== env('CRON_SECRET')) return json({ error: 'forbidden' }, 403);
      return json(await service.runDue(Number(body.limit) || 5));
    }

    const user = await userFrom(req);
    const userId = user?.id ?? null;
    const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    const needUser = () => {
      if (!userId) throw new ServiceError('forbidden', 'sign_in_required');
      return userId;
    };

    switch (body.action) {
      case 'config':
        return json({ live: !!provider(), captcha: !!env('TURNSTILE_SECRET_KEY'), payments: !!env('STRIPE_SECRET_KEY') });
      case 'scan':
        if (!provider()) return json({ error: 'not_configured' }, 503);
        // Bot check on every scan request (invisible for most people). Tokens are single-use.
        if (env('TURNSTILE_SECRET_KEY') && !(await verifyTurnstile(body.captchaToken, env('TURNSTILE_SECRET_KEY'), ip))) {
          return json({ error: 'captcha' }, 403);
        }
        return json(await service.scan({ address: String(body.address ?? ''), userId, ip }));
      case 'report':
        return json(await service.getReport({ reportId: String(body.reportId ?? ''), userId, claimToken: body.claimToken ?? null }));
      case 'task':
        await service.updateTask({ userId: needUser(), reportId: String(body.reportId), fid: String(body.fid), status: body.status, note: body.note });
        return json({ ok: true });
      case 'membership':
        await service.updateMembership({ userId: needUser(), reportId: String(body.reportId), ownerName: body.ownerName, monitor: body.monitor });
        return json({ ok: true });
      case 'rescan':
        return json(await service.rescan({ userId: needUser(), reportId: String(body.reportId) }));
      case 'checkout': {
        const uid = needUser();
        if (!env('STRIPE_SECRET_KEY')) return json({ error: 'not_configured' }, 503);
        const reportId = String(body.reportId ?? '');
        const view = await service.getReport({ reportId, userId: uid, claimToken: body.claimToken ?? null });
        if (!view.member) return json({ error: 'forbidden' }, 403);
        const base = safeReturnBase(req.headers.get('origin'));
        const back = `${base}/#/r/${reportId}`;
        const session = await createCheckoutSession({
          secretKey: env('STRIPE_SECRET_KEY'),
          priceId: env('STRIPE_PRICE_ID') || undefined,
          amountCents: service.price.cents,
          productName: `HomePrint: ${view.display} (12 months)`,
          successUrl: `${base}/?paid={CHECKOUT_SESSION_ID}&next=${encodeURIComponent(`#/r/${reportId}`)}`,
          cancelUrl: back,
          userId: uid,
          reportId,
          email: user?.email,
          locale: body.lang === 'es' ? 'es' : 'en',
        });
        return json({ url: session.url });
      }
      case 'confirm': {
        // Return-page check, in case the webhook hasn't arrived yet. Idempotent with the webhook.
        const uid = needUser();
        if (!env('STRIPE_SECRET_KEY')) return json({ error: 'not_configured' }, 503);
        const s = await getCheckoutSession(env('STRIPE_SECRET_KEY'), String(body.sessionId ?? ''));
        if (!s.paid || s.userId !== uid || !s.reportId) return json({ ok: false });
        await service.grantPurchase({ userId: uid, reportId: s.reportId, sessionId: s.id, amountCents: s.amountCents });
        return json({ ok: true, reportId: s.reportId });
      }
      case 'mine':
        return json(await service.myReports(needUser()));
      default:
        return json({ error: 'unknown_action' }, 400);
    }
  } catch (e) {
    if (e instanceof ServiceError) return json({ error: e.code, detail: e.detail }, STATUS[e.code]);
    console.error('api error', e);
    return json({ error: 'server_error' }, 500);
  }
});

