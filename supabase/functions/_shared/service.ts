// Application service: scanning, locked/unlocked report views, claiming, removal tracking and re-scans.
// Storage is behind the `Store` interface so the same logic runs on Supabase (Edge Function) and in
// memory (tests and the in-browser demo).

import { type Address, AddressError, addressKey, displayAddress, parseAddress } from './address.ts';
import { type DirectCheck, type Finding, type ScanDiagnostics, runScan, scanFailed, type EngineOptions } from './engine.ts';
import { playbookFor } from './playbooks.ts';
import type { MediaType, SiteCategory } from './sites.ts';

export type TaskStatus = 'todo' | 'sent' | 'waiting' | 'removed' | 'cant';

export interface ReportRow {
  id: string;
  address_key: string;
  address: Address;
  display: string;
  created_at: string;
  last_scanned_at: string | null;
  next_scan_at: string | null;
  scan_count: number;
  last_status: 'pending' | 'ok' | 'failed';
  checks: DirectCheck[];
}
export interface FindingRow {
  report_id: string;
  fid: string;
  data: Finding;
  preview: boolean;
  first_seen_at: string;
  last_seen_at: string;
  still_found: boolean;
  gone_verified_at: string | null;
}
export interface TaskRow {
  user_id: string;
  report_id: string;
  fid: string;
  status: TaskStatus;
  note: string;
  updated_at: string;
}
export interface RunRow {
  id?: number;
  report_id: string;
  kind: 'initial' | 'refresh' | 'manual' | 'scheduled';
  started_at: string;
  finished_at?: string | null;
  status: string;
  found: number;
  new_count: number;
  gone_count: number;
  diagnostics?: ScanDiagnostics | null;
}
export interface MembershipRow {
  user_id: string;
  report_id: string;
  created_at: string;
  monitor: boolean;
  owner_name: string;
}

export interface EntitlementRow {
  user_id: string;
  report_id: string;
  session_id: string;
  amount_cents: number;
  paid_at: string;
  paid_until: string;
}

export interface Store {
  getReportByKey(key: string): Promise<ReportRow | null>;
  getReport(id: string): Promise<ReportRow | null>;
  insertReport(row: Omit<ReportRow, 'id' | 'created_at'>): Promise<ReportRow>;
  updateReport(id: string, patch: Partial<ReportRow>): Promise<void>;
  listFindings(reportId: string): Promise<FindingRow[]>;
  upsertFindings(rows: FindingRow[]): Promise<void>;
  insertClaimToken(hash: string, reportId: string): Promise<void>;
  consumeClaimToken(hash: string, reportId: string): Promise<boolean>;
  getMembership(userId: string, reportId: string): Promise<MembershipRow | null>;
  upsertMembership(row: Partial<MembershipRow> & { user_id: string; report_id: string }): Promise<void>;
  listMemberships(userId: string): Promise<MembershipRow[]>;
  listTasks(userId: string, reportId: string): Promise<TaskRow[]>;
  upsertTask(row: TaskRow): Promise<void>;
  insertRun(row: RunRow): Promise<number>;
  updateRun(id: number, patch: Partial<RunRow>): Promise<void>;
  listRuns(reportId: string, limit: number): Promise<RunRow[]>;
  bump(bucket: string, ttlSeconds: number): Promise<number>;
  /** Reports with at least one active, monitoring paid entitlement whose next scan is due. */
  dueMonitoredReports(nowIso: string, limit: number): Promise<ReportRow[]>;
  getEntitlement(userId: string, reportId: string): Promise<EntitlementRow | null>;
  /** Insert or extend; must be idempotent on session_id. Returns false if this session was already applied. */
  grantEntitlement(row: EntitlementRow): Promise<boolean>;
  countRuns(reportId: string, kind: RunRow['kind'], sinceIso: string): Promise<number>;
}

export interface ServiceConfig {
  store: Store;
  engine: () => EngineOptions;
  now?: () => Date;
  randomToken?: () => string;
  hash?: (s: string) => Promise<string>;
  limits?: Partial<Limits>;
  ipSalt?: string;
  verifyGone?: (url: string) => Promise<'gone' | 'live' | 'unknown'>;
  priceCents?: number;
}

export interface Limits {
  anyPerIpPer10Min: number; // every scan request, including cached addresses
  perIpPer10Min: number; // new (uncached) scans, burst protection
  anonPerIpPerDay: number; // new scans without an account
  userPerDay: number; // new scans per signed-in account
  maxHomesPerUser: number; // homes one account can follow
  perDay: number; // site-wide cap on search API spend
  reuseHours: number; // same address within this window reuses the last scan
  manualRescanHours: number;
  manualRescansPer30Days: number;
}

export class ServiceError extends Error {
  constructor(public code: 'invalid_address' | 'payment_required' | 'busy' | 'daily_limit' | 'limit_anon' | 'limit_user' | 'limit_homes' | 'captcha' | 'scan_failed' | 'not_found' | 'forbidden' | 'too_soon', public detail?: string) {
    super(code);
  }
}

// ─── Views returned to the browser ──────────────────────────────────────────
export interface LockedFinding {
  locked: true;
  id: string;
  siteName: string;
  category: SiteCategory;
  media: MediaType[];
  confidence: Finding['confidence'];
}
export interface OpenFinding extends Finding {
  locked: false;
  preview: boolean;
  stillFound: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  goneVerifiedAt: string | null;
  task?: { status: TaskStatus; note: string; updatedAt: string };
}
export type ViewFinding = LockedFinding | OpenFinding;

export interface ReportView {
  id: string;
  display: string;
  address: Address;
  status: ReportRow['last_status'];
  scannedAt: string | null;
  nextScanAt: string | null;
  member: boolean; // saved to this account
  unlocked: boolean; // paid and within the 12-month window
  paidUntil: string | null;
  price: { cents: number; currency: string };
  rescansLeft: number;
  counts: { total: number; exact: number; likely: number; gone: number; byMedia: Partial<Record<MediaType, number>>; byCategory: Partial<Record<SiteCategory, number>> };
  findings: ViewFinding[];
  checks: DirectCheck[];
  history: { at: string; found: number; newCount: number; goneCount: number; kind: RunRow['kind'] }[];
  ownerName?: string;
  monitor?: boolean;
}

export interface MyReportSummary {
  id: string;
  display: string;
  scannedAt: string | null;
  nextScanAt: string | null;
  total: number;
  removed: number;
  inProgress: number;
  monitor: boolean;
  paidUntil: string | null;
}

const defaultHash = async (s: string): Promise<string> => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
};
const defaultToken = (): string => {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const DAY_MS = 24 * 3600 * 1000;
const RECHECK_MS = 15 * DAY_MS; // twice a month
const YEAR_MS = 365 * DAY_MS;

export function createService(cfg: ServiceConfig) {
  const { store } = cfg;
  const now = cfg.now ?? (() => new Date());
  const hash = cfg.hash ?? defaultHash;
  const token = cfg.randomToken ?? defaultToken;
  const limits: Limits = {
    anyPerIpPer10Min: 30, perIpPer10Min: 6, anonPerIpPerDay: 3, userPerDay: 10, maxHomesPerUser: 25,
    perDay: 300, reuseHours: 24, manualRescanHours: 12, manualRescansPer30Days: 2, ...cfg.limits,
  };
  const price = { cents: cfg.priceCents ?? 1999, currency: 'usd' };
  const isActive = (e: EntitlementRow | null) => !!e && new Date(e.paid_until).getTime() > now().getTime();
  async function unlockedFor(userId: string | null, reportId: string): Promise<EntitlementRow | null> {
    if (!userId) return null;
    const e = await store.getEntitlement(userId, reportId);
    return isActive(e) ? e : null;
  }
  async function requireUnlocked(userId: string, reportId: string): Promise<void> {
    if (!(await store.getMembership(userId, reportId))) throw new ServiceError('forbidden');
    if (!(await unlockedFor(userId, reportId))) throw new ServiceError('payment_required');
  }
  async function rescansLeft(reportId: string): Promise<number> {
    const since = new Date(now().getTime() - 30 * DAY_MS).toISOString();
    return Math.max(0, limits.manualRescansPer30Days - (await store.countRuns(reportId, 'manual', since)));
  }
  const ipKey = (ip: string) => hash(`${cfg.ipSalt ?? ''}:${ip}`);

  async function runAndStore(report: ReportRow, kind: RunRow['kind']): Promise<ReportRow> {
    const started = now().toISOString();
    const runId = await store.insertRun({ report_id: report.id, kind, started_at: started, status: 'running', found: 0, new_count: 0, gone_count: 0 });
    const result = await runScan(report.address, cfg.engine());
    if (scanFailed(result)) {
      await store.updateRun(runId, { status: 'failed', finished_at: now().toISOString(), diagnostics: result.diagnostics });
      await store.updateReport(report.id, { last_status: report.last_scanned_at ? report.last_status : 'failed' });
      throw new ServiceError('scan_failed');
    }
    const existing = new Map((await store.listFindings(report.id)).map((f) => [f.fid, f]));
    const seen = new Set<string>();
    const rows: FindingRow[] = [];
    let newCount = 0;
    for (const f of result.findings) {
      seen.add(f.id);
      const prev = existing.get(f.id);
      if (!prev) newCount++;
      rows.push({
        report_id: report.id, fid: f.id, data: f, preview: false,
        first_seen_at: prev?.first_seen_at ?? started, last_seen_at: started, still_found: true, gone_verified_at: null,
      });
    }
    let goneCount = 0;
    for (const prev of existing.values()) {
      if (seen.has(prev.fid)) continue;
      const row = { ...prev, still_found: false };
      if (prev.still_found && cfg.verifyGone && !prev.gone_verified_at) {
        const v = await cfg.verifyGone(prev.data.url).catch(() => 'unknown' as const);
        if (v === 'gone') { row.gone_verified_at = started; goneCount++; }
      }
      rows.push(row);
    }
    // Preview: exactly one finding is open to anonymous visitors. Strongest evidence wins:
    // exact match, a portal lookup, the most media types.
    const candidates = rows.filter((r) => r.still_found && r.data.confidence === 'exact');
    candidates.sort((a, b) =>
      Number(b.data.evidence.includes('portal_lookup')) - Number(a.data.evidence.includes('portal_lookup')) ||
      b.data.media.length - a.data.media.length || a.fid.localeCompare(b.fid));
    const previewId = candidates[0]?.fid;
    for (const r of rows) r.preview = r.fid === previewId;
    await store.upsertFindings(rows);
    const patch: Partial<ReportRow> = {
      last_scanned_at: started, next_scan_at: new Date(now().getTime() + RECHECK_MS).toISOString(),
      scan_count: report.scan_count + 1, last_status: 'ok', checks: result.checks,
    };
    await store.updateReport(report.id, patch);
    await store.updateRun(runId, { status: 'ok', finished_at: now().toISOString(), found: result.findings.length, new_count: kind === 'initial' ? 0 : newCount, gone_count: goneCount, diagnostics: result.diagnostics });
    return { ...report, ...patch } as ReportRow;
  }

  async function buildView(report: ReportRow, userId: string | null): Promise<ReportView> {
    const membership = userId ? await store.getMembership(userId, report.id) : null;
    const member = !!membership;
    const ent = member ? await unlockedFor(userId, report.id) : null;
    const unlocked = !!ent;
    const rows = await store.listFindings(report.id);
    const tasks = unlocked ? new Map((await store.listTasks(userId!, report.id)).map((t) => [t.fid, t])) : new Map();
    const live = rows.filter((r) => r.still_found);
    const byMedia: ReportView['counts']['byMedia'] = {};
    const byCategory: ReportView['counts']['byCategory'] = {};
    for (const r of live) {
      for (const m of r.data.media) byMedia[m] = (byMedia[m] ?? 0) + 1;
      byCategory[r.data.category] = (byCategory[r.data.category] ?? 0) + 1;
    }
    const visible = unlocked ? rows : live;
    const findings: ViewFinding[] = visible.map((r) => {
      if (!unlocked && !r.preview) {
        return { locked: true, id: r.fid, siteName: r.data.siteName, category: r.data.category, media: r.data.media, confidence: r.data.confidence };
      }
      const t = tasks.get(r.fid);
      return {
        ...r.data, locked: false, preview: r.preview, stillFound: r.still_found, firstSeenAt: r.first_seen_at,
        lastSeenAt: r.last_seen_at, goneVerifiedAt: r.gone_verified_at,
        task: t ? { status: t.status, note: t.note, updatedAt: t.updated_at } : undefined,
      };
    });
    findings.sort((a, b) => Number(b.locked === false && (b as OpenFinding).preview) - Number(a.locked === false && (a as OpenFinding).preview));
    const runs = unlocked ? await store.listRuns(report.id, 24) : [];
    return {
      id: report.id, display: report.display, address: report.address, status: report.last_status,
      scannedAt: report.last_scanned_at, nextScanAt: unlocked ? report.next_scan_at : null, member, unlocked,
      paidUntil: ent?.paid_until ?? null, price, rescansLeft: unlocked ? await rescansLeft(report.id) : 0,
      counts: {
        total: live.length, exact: live.filter((r) => r.data.confidence === 'exact').length,
        likely: live.filter((r) => r.data.confidence === 'likely').length,
        gone: rows.filter((r) => !r.still_found).length, byMedia, byCategory,
      },
      findings,
      checks: report.checks ?? [],
      history: runs.filter((r) => r.status === 'ok').map((r) => ({ at: r.started_at, found: r.found, newCount: r.new_count, goneCount: r.gone_count, kind: r.kind })),
      ownerName: membership?.owner_name,
      monitor: membership?.monitor,
    };
  }

  return {
    async scan(input: { address: string; userId: string | null; ip: string }): Promise<{ view: ReportView; claimToken: string | null }> {
      let address: Address;
      try {
        address = parseAddress(input.address);
      } catch (e) {
        throw new ServiceError('invalid_address', e instanceof AddressError ? e.code : undefined);
      }
      const key = addressKey(address);
      const t = now().getTime();
      const day = now().toISOString().slice(0, 10);
      const ipHash = await ipKey(input.ip);
      if ((await store.bump(`any:${ipHash}:${Math.floor(t / 600000)}`, 600)) > limits.anyPerIpPer10Min) throw new ServiceError('busy');
      let report = await store.getReportByKey(key);
      if (input.userId) {
        const homes = await store.listMemberships(input.userId);
        if (homes.length >= limits.maxHomesPerUser && !homes.some((h) => h.report_id === report?.id)) throw new ServiceError('limit_homes');
      }
      const fresh = report?.last_scanned_at && report.last_status === 'ok' && t - new Date(report.last_scanned_at).getTime() < limits.reuseHours * 3600 * 1000;
      if (!fresh) {
        // Only scans that spend search credits count toward these limits.
        if ((await store.bump(`ip:${ipHash}:${Math.floor(t / 600000)}`, 600)) > limits.perIpPer10Min) throw new ServiceError('busy');
        if (input.userId) {
          if ((await store.bump(`user:${input.userId}:${day}`, 86400)) > limits.userPerDay) throw new ServiceError('limit_user');
        } else if ((await store.bump(`anon:${ipHash}:${day}`, 86400)) > limits.anonPerIpPerDay) {
          throw new ServiceError('limit_anon');
        }
        if ((await store.bump(`day:${day}`, 2 * 86400)) > limits.perDay) throw new ServiceError('daily_limit');
        if (!report) {
          report = await store.insertReport({ address_key: key, address, display: displayAddress(address), last_scanned_at: null, next_scan_at: null, scan_count: 0, last_status: 'pending', checks: [] });
        }
        report = await runAndStore(report, report.scan_count === 0 ? 'initial' : 'refresh');
      }
      let claimToken: string | null = null;
      if (input.userId) {
        await store.upsertMembership({ user_id: input.userId, report_id: report!.id });
      } else {
        claimToken = token();
        await store.insertClaimToken(await hash(claimToken), report!.id);
      }
      return { view: await buildView(report!, input.userId), claimToken };
    },

    async getReport(input: { reportId: string; userId: string | null; claimToken?: string | null }): Promise<ReportView> {
      const report = await store.getReport(input.reportId);
      if (!report) throw new ServiceError('not_found');
      if (input.userId && input.claimToken && !(await store.getMembership(input.userId, report.id))) {
        if (await store.consumeClaimToken(await hash(input.claimToken), report.id)) {
          await store.upsertMembership({ user_id: input.userId, report_id: report.id });
        }
      }
      return buildView(report, input.userId);
    },

    async updateTask(input: { userId: string; reportId: string; fid: string; status: TaskStatus; note?: string }): Promise<void> {
      await requireUnlocked(input.userId, input.reportId);
      const valid: TaskStatus[] = ['todo', 'sent', 'waiting', 'removed', 'cant'];
      if (!valid.includes(input.status)) throw new ServiceError('forbidden', 'bad_status');
      await store.upsertTask({ user_id: input.userId, report_id: input.reportId, fid: input.fid, status: input.status, note: (input.note ?? '').slice(0, 1000), updated_at: now().toISOString() });
    },

    async updateMembership(input: { userId: string; reportId: string; ownerName?: string; monitor?: boolean }): Promise<void> {
      if (!(await store.getMembership(input.userId, input.reportId))) throw new ServiceError('forbidden');
      await store.upsertMembership({
        user_id: input.userId, report_id: input.reportId,
        ...(input.ownerName !== undefined ? { owner_name: input.ownerName.slice(0, 120) } : {}),
        ...(input.monitor !== undefined ? { monitor: input.monitor } : {}),
      });
    },

    async rescan(input: { userId: string; reportId: string }): Promise<ReportView> {
      await requireUnlocked(input.userId, input.reportId);
      const report = await store.getReport(input.reportId);
      if (!report) throw new ServiceError('not_found');
      if ((await rescansLeft(report.id)) <= 0) {
        const runs = await store.listRuns(report.id, 50);
        const since = now().getTime() - 30 * DAY_MS;
        const manual = runs.filter((r) => r.kind === 'manual' && new Date(r.started_at).getTime() > since).map((r) => new Date(r.started_at).getTime()).sort((a, b) => a - b);
        throw new ServiceError('too_soon', new Date((manual[0] ?? now().getTime()) + 30 * DAY_MS).toISOString());
      }
      if (report.last_scanned_at && now().getTime() - new Date(report.last_scanned_at).getTime() < limits.manualRescanHours * 3600 * 1000) {
        throw new ServiceError('too_soon', new Date(new Date(report.last_scanned_at).getTime() + limits.manualRescanHours * 3600 * 1000).toISOString());
      }
      const updated = await runAndStore(report, 'manual');
      return buildView(updated, input.userId);
    },

    async myReports(userId: string): Promise<MyReportSummary[]> {
      const out: MyReportSummary[] = [];
      for (const m of await store.listMemberships(userId)) {
        const r = await store.getReport(m.report_id);
        if (!r) continue;
        const rows = await store.listFindings(r.id);
        const tasks = await store.listTasks(userId, r.id);
        const removed = new Set([...tasks.filter((t) => t.status === 'removed').map((t) => t.fid), ...rows.filter((x) => x.gone_verified_at).map((x) => x.fid)]);
        out.push({
          id: r.id, display: r.display, scannedAt: r.last_scanned_at, monitor: m.monitor,
          nextScanAt: (await unlockedFor(userId, r.id)) ? r.next_scan_at : null,
          paidUntil: (await unlockedFor(userId, r.id))?.paid_until ?? null,
          total: rows.length, removed: removed.size,
          inProgress: tasks.filter((t) => (t.status === 'sent' || t.status === 'waiting') && !removed.has(t.fid)).length,
        });
      }
      return out;
    },

    /** Record a completed payment (from the Stripe webhook or the return-page confirmation). Idempotent. */
    async grantPurchase(input: { userId: string; reportId: string; sessionId: string; amountCents: number }): Promise<boolean> {
      const report = await store.getReport(input.reportId);
      if (!report) throw new ServiceError('not_found');
      await store.upsertMembership({ user_id: input.userId, report_id: input.reportId, monitor: true });
      const prev = await store.getEntitlement(input.userId, input.reportId);
      const base = prev && isActive(prev) ? new Date(prev.paid_until).getTime() : now().getTime();
      const granted = await store.grantEntitlement({
        user_id: input.userId, report_id: input.reportId, session_id: input.sessionId, amount_cents: input.amountCents,
        paid_at: now().toISOString(), paid_until: new Date(base + YEAR_MS).toISOString(),
      });
      // Start the twice-monthly re-check clock from the purchase.
      if (granted && (!report.next_scan_at || new Date(report.next_scan_at).getTime() > now().getTime() + RECHECK_MS)) {
        await store.updateReport(report.id, { next_scan_at: new Date(now().getTime() + RECHECK_MS).toISOString() });
      }
      return granted;
    },

    price,

    /** Called hourly by pg_cron. Re-scans paid, monitored reports whose twice-monthly re-check is due. */
    async runDue(limit = 5): Promise<{ scanned: number; failed: number }> {
      const due = await store.dueMonitoredReports(now().toISOString(), limit);
      let scanned = 0;
      let failed = 0;
      for (const r of due) {
        try {
          await runAndStore(r, 'scheduled');
          scanned++;
        } catch {
          failed++;
          await store.updateReport(r.id, { next_scan_at: new Date(now().getTime() + 24 * 3600 * 1000).toISOString() });
        }
      }
      return { scanned, failed };
    },

    playbookFor,
  };
}

export type Service = ReturnType<typeof createService>;

/** Fetch-based check used during re-scans: is a page we stopped finding actually gone? */
export function httpVerifier(fetchFn: typeof fetch = fetch) {
  return async (url: string): Promise<'gone' | 'live' | 'unknown'> => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    try {
      const res = await fetchFn(url, { method: 'GET', redirect: 'manual', signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 HomePrint-Verifier' } });
      if (res.status === 404 || res.status === 410) return 'gone';
      if (res.status >= 200 && res.status < 300) return 'live';
      return 'unknown'; // redirects, bot walls (403/429) and server errors prove nothing
    } catch {
      return 'unknown';
    } finally {
      clearTimeout(t);
    }
  };
}
