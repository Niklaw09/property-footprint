// Property Footprint API (Supabase Edge Function, Deno).
// POST /functions/v1/api  { action, ...params }   Authorization: Bearer <user JWT or anon key>
//
// Secrets: SERPER_API_KEY (or BRAVE_API_KEY), CRON_SECRET, TURNSTILE_SECRET_KEY, optional SCAN_DAILY_LIMIT, IP_HASH_SALT.
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { createService, httpVerifier, ServiceError } from '../_shared/service.ts';
import { braveProvider, serperProvider, type SearchProvider } from '../_shared/providers.ts';
import { supabaseStore } from './supabaseStore.ts';
import { verifyTurnstile } from '../_shared/turnstile.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

const STATUS: Record<ServiceError['code'], number> = {
  invalid_address: 400, busy: 429, daily_limit: 429, limit_anon: 429, limit_user: 429, limit_homes: 429, captcha: 403, scan_failed: 502, not_found: 404, forbidden: 403, too_soon: 429,
};

async function userIdFrom(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization') ?? '';
  const jwt = auth.replace(/^Bearer\s+/i, '');
  if (!jwt || jwt === env('SUPABASE_ANON_KEY')) return null;
  const { data, error } = await db.auth.getUser(jwt);
  if (error || !data.user) return null;
  return data.user.id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  try {
    if (body.action === 'cron') {
      if (!env('CRON_SECRET') || req.headers.get('x-cron-secret') !== env('CRON_SECRET')) return json({ error: 'forbidden' }, 403);
      return json(await service.runDue(Number(body.limit) || 5));
    }

    const userId = await userIdFrom(req);
    const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    const needUser = () => {
      if (!userId) throw new ServiceError('forbidden', 'sign_in_required');
      return userId;
    };

    switch (body.action) {
      case 'config':
        return json({ live: !!provider(), captcha: !!env('TURNSTILE_SECRET_KEY') });
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
