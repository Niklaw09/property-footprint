// In-memory Store for tests and the in-browser demo.
import type { FindingRow, MembershipRow, ReportRow, RunRow, Store, TaskRow } from './service.ts';

export function memoryStore(): Store & { dump(): unknown } {
  const reports = new Map<string, ReportRow>();
  const findings = new Map<string, FindingRow>();
  const tokens = new Map<string, { report_id: string; used: boolean }>();
  const members = new Map<string, MembershipRow>();
  const tasks = new Map<string, TaskRow>();
  const runs: RunRow[] = [];
  const buckets = new Map<string, number>();
  let seq = 0;
  const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

  return {
    async getReportByKey(key) {
      for (const r of reports.values()) if (r.address_key === key) return clone(r);
      return null;
    },
    async getReport(id) {
      const r = reports.get(id);
      return r ? clone(r) : null;
    },
    async insertReport(row) {
      const id = `rep_${(++seq).toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const r: ReportRow = { ...clone(row), id, created_at: new Date().toISOString() };
      reports.set(id, r);
      return clone(r);
    },
    async updateReport(id, patch) {
      const r = reports.get(id);
      if (r) reports.set(id, { ...r, ...clone(patch) });
    },
    async listFindings(reportId) {
      return [...findings.values()].filter((f) => f.report_id === reportId).map(clone);
    },
    async upsertFindings(rows) {
      for (const r of rows) findings.set(`${r.report_id}:${r.fid}`, clone(r));
    },
    async insertClaimToken(hash, reportId) {
      tokens.set(hash, { report_id: reportId, used: false });
    },
    async consumeClaimToken(hash, reportId) {
      const t = tokens.get(hash);
      if (!t || t.used || t.report_id !== reportId) return false;
      t.used = true;
      return true;
    },
    async getMembership(userId, reportId) {
      const m = members.get(`${userId}:${reportId}`);
      return m ? clone(m) : null;
    },
    async upsertMembership(row) {
      const k = `${row.user_id}:${row.report_id}`;
      const prev = members.get(k) ?? { user_id: row.user_id, report_id: row.report_id, created_at: new Date().toISOString(), monitor: true, owner_name: '' };
      members.set(k, { ...prev, ...clone(row) });
    },
    async listMemberships(userId) {
      return [...members.values()].filter((m) => m.user_id === userId).map(clone);
    },
    async listTasks(userId, reportId) {
      return [...tasks.values()].filter((t) => t.user_id === userId && t.report_id === reportId).map(clone);
    },
    async upsertTask(row) {
      tasks.set(`${row.user_id}:${row.report_id}:${row.fid}`, clone(row));
    },
    async insertRun(row) {
      const id = runs.length + 1;
      runs.push({ ...clone(row), id });
      return id;
    },
    async updateRun(id, patch) {
      const i = runs.findIndex((r) => r.id === id);
      if (i >= 0) runs[i] = { ...runs[i], ...clone(patch) };
    },
    async listRuns(reportId, limit) {
      return runs.filter((r) => r.report_id === reportId).sort((a, b) => b.started_at.localeCompare(a.started_at)).slice(0, limit).map(clone);
    },
    async bump(bucket) {
      const n = (buckets.get(bucket) ?? 0) + 1;
      buckets.set(bucket, n);
      return n;
    },
    async dueMonitoredReports(nowIso, limit) {
      const monitored = new Set([...members.values()].filter((m) => m.monitor).map((m) => m.report_id));
      return [...reports.values()].filter((r) => monitored.has(r.id) && r.next_scan_at && r.next_scan_at <= nowIso).slice(0, limit).map(clone);
    },
    dump() {
      return { reports: [...reports.values()], findings: [...findings.values()], members: [...members.values()], tasks: [...tasks.values()], runs };
    },
  };
}
