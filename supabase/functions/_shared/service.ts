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
  kind: 'initial' | 'manual' | 'scheduled';
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
  dueMonitoredReports(nowIso: string, limit: number): Promise<ReportRow[]>;
}

export interface ServiceConfig {
  store: Store;
  engine: () => EngineOptions;
  now?: () => Date;
  randomToken?: () => string;
  hash?: (s: string) => Promise<string>;
  limits?: { perIpPer10Min?: number; perDay?: number; reuseHours?: number; manualRescanHours?: number };
  verifyGone?: (url: string) => Promise<'gone' | 'live' | 'unknown'>;
}

export class ServiceError extends Error {
  constructor(public code: 'invalid_address' | 'busy' | 'daily_limit' | 'scan_failed' | 'not_found' | 'forbidden' | 'too_soon', public detail?: string) {
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
  member: boolean;
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

const WEEK_MS = 7 * 24 * 3600 * 1000;

export function createService(cfg: ServiceConfig) {
  const { store } = cfg;
  const now = cfg.now ?? (() => new Date());
  const hash = cfg.hash ?? defaultHash;
  const token = cfg.randomToken ?? defaultToken;
  const limits = { perIpPer10Min: 6, perDay: 300, reuseHours: 24, manualRescanHours: 12, ...cfg.limits };

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
      last_scanned_at: started, next_scan_at: new Date(now().getTime() + WEEK_MS).toISOString(),
      scan_count: report.scan_count + 1, last_status: 'ok', checks: result.checks,
    };
    await store.updateReport(report.id, patch);
    await store.updateRun(runId, { status: 'ok', finished_at: now().toISOString(), found: result.findings.length, new_count: kind === 'initial' ? 0 : newCount, gone_count: goneCount, diagnostics: result.diagnostics });
    return { ...report, ...patch } as ReportRow;
  }

  async function buildView(report: ReportRow, userId: string | null): Promise<ReportView> {
    const membership = userId ? await store.getMembership(userId, report.id) : null;
    const member = !!membership;
    const rows = await store.listFindings(report.id);
    const tasks = member ? new Map((await store.listTasks(userId!, report.id)).map((t) => [t.fid, t])) : new Map();
    const live = rows.filter((r) => r.still_found);
    const byMedia: ReportView['counts']['byMedia'] = {};
    const byCategory: ReportView['counts']['byCategory'] = {};
    for (const r of live) {
      for (const m of r.data.media) byMedia[m] = (byMedia[m] ?? 0) + 1;
      byCategory[r.data.category] = (byCategory[r.data.category] ?? 0) + 1;
    }
    const visible = member ? rows : live;
    const findings: ViewFinding[] = visible.map((r) => {
      if (!member && !r.preview) {
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
    const runs = member ? await store.listRuns(report.id, 12) : [];
    return {
      id: report.id, display: report.display, address: report.address, status: report.last_status,
      scannedAt: report.last_scanned_at, nextScanAt: member ? report.next_scan_at : null, member,
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
      let report = await store.getReportByKey(key);
      const fresh = report?.last_scanned_at && report.last_status === 'ok' && now().getTime() - new Date(report.last_scanned_at).getTime() < limits.reuseHours * 3600 * 1000;
      if (!fresh) {
        const ipCount = await store.bump(`ip:${await hash(input.ip)}:${Math.floor(now().getTime() / 600000)}`, 600);
        if (ipCount > limits.perIpPer10Min) throw new ServiceError('busy');
        const day = now().toISOString().slice(0, 10);
        const dayCount = await store.bump(`day:${day}`, 2 * 86400);
        if (dayCount > limits.perDay) throw new ServiceError('daily_limit');
        if (!report) {
          report = await store.insertReport({ address_key: key, address, display: displayAddress(address), last_scanned_at: null, next_scan_at: null, scan_count: 0, last_status: 'pending', checks: [] });
        }
        report = await runAndStore(report, report.scan_count === 0 ? 'initial' : 'manual');
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
      if (!(await store.getMembership(input.userId, input.reportId))) throw new ServiceError('forbidden');
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
      if (!(await store.getMembership(input.userId, input.reportId))) throw new ServiceError('forbidden');
      const report = await store.getReport(input.reportId);
      if (!report) throw new ServiceError('not_found');
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
          id: r.id, display: r.display, scannedAt: r.last_scanned_at, nextScanAt: r.next_scan_at, monitor: m.monitor,
          total: rows.length, removed: removed.size,
          inProgress: tasks.filter((t) => (t.status === 'sent' || t.status === 'waiting') && !removed.has(t.fid)).length,
        });
      }
      return out;
    },

    /** Called hourly by pg_cron. Re-scans monitored reports whose weekly re-scan is due. */
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
      const res = await fetchFn(url, { method: 'GET', redirect: 'manual', signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 PropertyFootprint-Verifier' } });
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
