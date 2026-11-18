// Store implementation backed by Supabase Postgres (service role; RLS blocks everyone else).
// deno-lint-ignore-file no-explicit-any
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.45.4';
import type { Store } from '../_shared/service.ts';

function check<T>(res: { data: T; error: any }): T {
  if (res.error) throw new Error(res.error.message ?? String(res.error));
  return res.data;
}

export function supabaseStore(db: SupabaseClient): Store {
  return {
    async getReportByKey(key) {
      return check(await db.from('reports').select('*').eq('address_key', key).maybeSingle()) as any;
    },
    async getReport(id) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
      return check(await db.from('reports').select('*').eq('id', id).maybeSingle()) as any;
    },
    async insertReport(row) {
      // Two people scanning the same new address at once: fall back to the existing row.
      const res = await db.from('reports').insert(row).select('*').single();
      if (res.error?.code === '23505') return check(await db.from('reports').select('*').eq('address_key', row.address_key).single()) as any;
      return check(res) as any;
    },
    async updateReport(id, patch) {
      check(await db.from('reports').update(patch).eq('id', id));
    },
    async listFindings(reportId) {
      return check(await db.from('findings').select('*').eq('report_id', reportId)) as any;
    },
    async upsertFindings(rows) {
      if (rows.length) check(await db.from('findings').upsert(rows, { onConflict: 'report_id,fid' }));
    },
    async insertClaimToken(hash, reportId) {
      check(await db.from('claim_tokens').insert({ token_hash: hash, report_id: reportId }));
    },
    async consumeClaimToken(hash, reportId) {
      const data = check(await db.from('claim_tokens').update({ used_at: new Date().toISOString() })
        .eq('token_hash', hash).eq('report_id', reportId).is('used_at', null).select('token_hash')) as any[];
      return data.length === 1;
    },
    async getMembership(userId, reportId) {
      return check(await db.from('memberships').select('*').eq('user_id', userId).eq('report_id', reportId).maybeSingle()) as any;
    },
    async upsertMembership(row) {
      check(await db.from('memberships').upsert(row, { onConflict: 'user_id,report_id' }));
    },
    async listMemberships(userId) {
      return check(await db.from('memberships').select('*').eq('user_id', userId).order('created_at', { ascending: false })) as any;
    },
    async listTasks(userId, reportId) {
      return check(await db.from('tasks').select('*').eq('user_id', userId).eq('report_id', reportId)) as any;
    },
    async upsertTask(row) {
      check(await db.from('tasks').upsert(row, { onConflict: 'user_id,report_id,fid' }));
    },
    async insertRun(row) {
      return (check(await db.from('scan_runs').insert(row).select('id').single()) as any).id;
    },
    async updateRun(id, patch) {
      check(await db.from('scan_runs').update(patch).eq('id', id));
    },
    async listRuns(reportId, limit) {
      return check(await db.from('scan_runs').select('id,report_id,kind,started_at,finished_at,status,found,new_count,gone_count')
        .eq('report_id', reportId).order('started_at', { ascending: false }).limit(limit)) as any;
    },
    async bump(bucket, ttl) {
      return check(await db.rpc('bump_bucket', { p_bucket: bucket, p_ttl_seconds: ttl })) as any;
    },
    async dueMonitoredReports(nowIso, limit) {
      const ids = (check(await db.from('memberships').select('report_id').eq('monitor', true)) as any[]).map((m) => m.report_id);
      if (!ids.length) return [];
      return check(await db.from('reports').select('*').in('id', [...new Set(ids)]).lte('next_scan_at', nowIso)
        .order('next_scan_at', { ascending: true }).limit(limit)) as any;
    },
  };
}
