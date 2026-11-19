import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';
import type { MyReportSummary, ReportView, TaskStatus } from '@engine/service.ts';

export type { ReportView, MyReportSummary, TaskStatus };
export type SelftestResult = Awaited<ReturnType<typeof import('@engine/selftest.ts').runSelftest>>;
export type { OpenFinding, LockedFinding, ViewFinding } from '@engine/service.ts';

export class ApiError extends Error {
  constructor(public code: string, public detail?: string) { super(code); }
}

export interface Api {
  mode: 'live' | 'demo';
  scan(address: string, captchaToken?: string | null): Promise<{ view: ReportView; claimToken: string | null }>;
  report(reportId: string, claimToken?: string | null): Promise<ReportView>;
  task(reportId: string, fid: string, status: TaskStatus, note?: string): Promise<void>;
  membership(reportId: string, patch: { ownerName?: string; monitor?: boolean }): Promise<void>;
  rescan(reportId: string): Promise<ReportView>;
  mine(): Promise<MyReportSummary[]>;
  selftest(): Promise<SelftestResult>;
  checkout(reportId: string, lang: string, plan?: 'quick' | 'monitor'): Promise<string>; // URL to send the browser to
  confirm(sessionId: string): Promise<{ ok: boolean; reportId?: string }>;
  claimPromo(reportId: string, lang: string): Promise<ReportView>;
  review(reportId: string, rating: number, comment: string): Promise<void>;
  promo(): Promise<ReportView['promo']>;
  // auth
  session(): Promise<{ email: string } | null>;
  onAuth(cb: (s: { email: string } | null) => void): () => void;
  sendMagicLink(email: string, nextHash: string): Promise<void>;
  signOut(): Promise<void>;
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function liveApi(sb: SupabaseClient): Api {
  const call = async <T>(body: Record<string, unknown>): Promise<T> => {
    const { data: s } = await sb.auth.getSession();
    const res = await fetch(`${url}/functions/v1/api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anon!, Authorization: `Bearer ${s.session?.access_token ?? anon}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(json.error ?? 'server_error', json.detail);
    return json as T;
  };
  const toUser = (s: Session | null) => (s?.user ? { email: s.user.email ?? '' } : null);
  return {
    mode: 'live',
    scan: (address, captchaToken) => call({ action: 'scan', address, captchaToken }),
    report: (reportId, claimToken) => call({ action: 'report', reportId, claimToken }),
    task: (reportId, fid, status, note) => call({ action: 'task', reportId, fid, status, note }),
    membership: (reportId, patch) => call({ action: 'membership', reportId, ...patch }),
    rescan: (reportId) => call({ action: 'rescan', reportId }),
    mine: () => call({ action: 'mine' }),
    selftest: () => call({ action: 'selftest' }),
    checkout: async (reportId, lang, plan = 'monitor') => (await call<{ url: string }>({ action: 'checkout', reportId, lang, plan, claimToken: claims.get(reportId) })).url,
    confirm: (sessionId) => call({ action: 'confirm', sessionId }),
    claimPromo: (reportId, lang) => call({ action: 'claim_promo', reportId, lang, claimToken: claims.get(reportId) }),
    review: (reportId, rating, comment) => call({ action: 'review', reportId, rating, comment }),
    promo: async () => (await call<{ promo: ReportView['promo'] }>({ action: 'config' })).promo ?? null,
    async session() { return toUser((await sb.auth.getSession()).data.session); },
    onAuth(cb) {
      const { data } = sb.auth.onAuthStateChange((_e, s) => cb(toUser(s)));
      return () => data.subscription.unsubscribe();
    },
    async sendMagicLink(email, nextHash) {
      const redirect = `${window.location.origin}${window.location.pathname}?next=${encodeURIComponent(nextHash)}`;
      const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
      if (error) throw new ApiError('auth_failed', error.message);
    },
    async signOut() { await sb.auth.signOut(); },
  };
}

let instance: Promise<Api> | null = null;

export function getApi(): Promise<Api> {
  if (!instance) {
    instance = url && anon
      ? Promise.resolve(liveApi(createClient(url, anon, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } })))
      : import('./demoApi').then((m) => m.demoApi());
  }
  return instance;
}

// Claim tokens: kept in the browser that ran the anonymous scan, exchanged for membership after sign-in.
export const claims = {
  get(reportId: string): string | null {
    try { return localStorage.getItem(`pf.claim.${reportId}`); } catch { return null; }
  },
  set(reportId: string, token: string) {
    try { localStorage.setItem(`pf.claim.${reportId}`, token); } catch { /* ignore */ }
  },
  clear(reportId: string) {
    try { localStorage.removeItem(`pf.claim.${reportId}`); } catch { /* ignore */ }
  },
};
