import { useState } from 'react';
import { Loader2, Play, CheckCircle2, XCircle } from 'lucide-react';
import type { SelftestResult } from '@/lib/api';
import { errorText } from '@/lib/errors';
import { useLang } from '@/lib/i18n';
import type { AppCtx } from '@/App';

// Owner tool (not linked in the UI): #/selftest runs the 10-home accuracy test on the live server.
export default function Selftest({ ctx }: { ctx: AppCtx }) {
  const { t } = useLang();
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');
  const [res, setRes] = useState<SelftestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setState('running'); setError(null);
    try { setRes(await ctx.api.selftest()); setState('done'); } catch (e) { setError(errorText(e, t)); setState('idle'); }
  };
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-navy-900">Accuracy check</h1>
      <p className="mt-2 text-sm text-navy-500">Scans 10 real homes sold in fall 2026 and counts how many of their confirmed pages the live engine finds. Uses about 200 to 250 search credits; limited to 10 runs a day.</p>
      <button onClick={run} disabled={state === 'running'} className="btn-primary mt-6">
        {state === 'running' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}{state === 'running' ? 'Running (about a minute)…' : 'Run accuracy check'}
      </button>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {res && (
        <div className="mt-8">
          <p className="font-serif text-4xl font-semibold text-navy-900">{res.namedPct ?? res.pct}%</p>
          <p className="text-sm text-navy-500">{res.namedFound} of {res.namedExpected} pages on named sites found (portals, brand brokerages, social)</p>
          <p className="mt-1 text-sm text-navy-500">All confirmed pages, including small agent sites: {res.found} of {res.expected} ({res.pct}%)</p>
          {res.photos && <p className="mt-1 text-sm text-navy-500">Photo check on exact matches: {res.photos.seen} photos seen, {res.photos.none} no photos seen, {res.photos.unknown} couldn’t check</p>}
          <p className="mt-1 text-sm text-navy-500">
            {res.exactPages} pages with an exact address match (about {Math.round(res.exactPages / Math.max(1, res.rows.length))} per home)
            {res.newExact ? `, ${res.newExact} of them new` : ''}{res.searchMode ? ` · searches: ${res.searchMode}` : ''}
          </p>
          {res.origExpected != null && <p className="mt-1 text-xs text-navy-400">Original 43-page list: {res.origFound} of {res.origExpected} ({res.origPct}%)</p>}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-navy-400"><tr><th className="py-2 pr-3">Home</th><th className="pr-3">Found</th><th className="pr-3">Total found</th><th className="pr-3">Zillow</th><th>Search errors</th></tr></thead>
              <tbody>
                {res.rows.map((r) => (
                  <tr key={r.address} className="border-t border-navy-100 align-top">
                    <td className="py-2 pr-3 text-navy-800">{r.address}{r.missed.length > 0 && <details className="text-xs text-navy-400"><summary>missed {r.missed.length}</summary>{r.missed.map((m) => <div key={m} className="break-all">{m}</div>)}</details>}</td>
                    <td className="pr-3">{r.namedFound}/{r.namedExpected} named<span className="block text-xs text-navy-400">{r.found}/{r.expected} all</span>{r.namedMissed?.length > 0 && <details className="text-xs text-navy-400"><summary>named missed</summary>{r.namedMissed.map((m) => <div key={m} className="break-all">{m}</div>)}</details>}</td>
                    <td className="pr-3">{r.total}{r.newExact ? <span className="block text-xs text-navy-400">{r.newExact} new</span> : null}</td>
                    {['zillow'].map((k) => {
                      const l = r.lookups.find((x) => x.key === k);
                      return <td key={k} className="pr-3">{l?.ok ? <span className="inline-flex items-center gap-1 text-sage-700"><CheckCircle2 className="h-4 w-4" />{l.found}</span> : <span className="inline-flex items-center gap-1 text-red-600"><XCircle className="h-4 w-4" />{l?.error ?? '—'}</span>}</td>;
                    })}
                    <td title={r.firstError}>{r.queryErrors}{r.firstError && <span className="block text-xs text-red-700">{r.firstError}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="mt-6 text-xs text-navy-400"><summary>Raw result (copy this to Claude)</summary><pre className="mt-2 whitespace-pre-wrap break-all rounded-lg bg-navy-50 p-3">{JSON.stringify(res)}</pre></details>
        </div>
      )}
    </div>
  );
}
