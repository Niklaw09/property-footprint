import { useState } from 'react';

const KEY = 'pf.selftestKey';
const readKey = () => { try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; } };
import { Loader2, Play, CheckCircle2, XCircle, Download } from 'lucide-react';
import { summarize, type RawHome } from '@engine/selftest.ts';
import type { SelftestResult } from '@/lib/api';
import { errorText } from '@/lib/errors';
import { useLang } from '@/lib/i18n';
import type { AppCtx } from '@/App';

// Owner tool (not linked in the UI): #/selftest runs the 10-home accuracy test on the live server.
export default function Selftest({ ctx }: { ctx: AppCtx }) {
  const { t } = useLang();
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');
  const [half, setHalf] = useState(0);
  const [raw, setRaw] = useState<RawHome[]>([]);
  const [res, setRes] = useState<SelftestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(readKey);
  const run = async () => {
    setState('running'); setError(null);
    try { localStorage.setItem(KEY, key.trim()); } catch { /* ignore */ }
    try {
      // Two halves of 10 homes, one after the other, so each fits in the server's time limit.
      setHalf(1);
      const a = await ctx.api.selftest(key.trim() || undefined, 0);
      setHalf(2);
      const b = await ctx.api.selftest(key.trim() || undefined, 1);
      setRaw([...(a.raw ?? []), ...(b.raw ?? [])]);
      setRes({ ...summarize([...a.rows, ...b.rows]), searchMode: b.searchMode ?? a.searchMode });
      setState('done');
    } catch (e) { setError(errorText(e, t)); setState('idle'); }
  };
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-navy-900">Accuracy check</h1>
      <p className="mt-2 text-sm text-navy-500">Scans 20 real homes in 18 markets and counts how many of their confirmed pages the live engine finds. Uses about 500 search credits (about 50¢); limited to 30 runs a day with the test key.</p>
      <label className="mt-6 block max-w-sm text-sm font-medium text-navy-700">Test key <span className="font-normal text-navy-400">(SELFTEST_KEY in Bolt; remembered on this browser. Not needed if you're signed in.)</span>
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" className="input-field mt-1" />
      </label>
      <button onClick={run} disabled={state === 'running'} className="btn-primary mt-4">
        {state === 'running' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}{state === 'running' ? `Running half ${half} of 2 (about a minute each)…` : 'Run accuracy check'}
      </button>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {res && (
        <div className="mt-8">
          <p className="font-serif text-4xl font-semibold text-navy-900">{res.sitesPct ?? res.namedPct ?? res.pct}%</p>
          <p className="text-sm text-navy-500">{res.sitesFound} of {res.sitesExpected} big sites found the home on (portals, brand brokerages, social; any page on the site counts)</p>
          <p className="mt-1 text-sm text-navy-500">Pages on big sites: {res.namedFound} of {res.namedExpected} ({res.namedPct}%)</p>
          <p className="mt-1 text-sm text-navy-500">All confirmed pages, including small agent sites: {res.found} of {res.expected} ({res.pct}%)</p>
          {res.photos && <p className="mt-1 text-sm text-navy-500">Photo check on exact matches: {res.photos.seen} photos seen, {res.photos.none} no photos seen, {res.photos.unknown} couldn’t check</p>}
          <p className="mt-1 text-sm text-navy-500">
            {res.exactPages} pages with an exact address match (about {Math.round(res.exactPages / Math.max(1, res.rows.length))} per home)
            {res.newExact ? `, ${res.newExact} of them new` : ''}{res.searchMode ? ` · searches: ${res.searchMode}` : ''}
          </p>
          {res.setA && <p className="mt-1 text-xs text-navy-400">First 10 homes only (to compare with earlier runs): {res.setA.sitesFound} of {res.setA.sitesExpected} big sites ({res.setA.sitesPct}%), pages on big sites {res.setA.namedPct}%</p>}
          {raw.length > 0 && (
            <button type="button" className="btn-secondary mt-4" onClick={() => {
              const blob = new Blob([JSON.stringify({ when: new Date().toISOString(), result: res, raw })], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `homeprint-accuracy-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(a.href), 5000);
            }}><Download className="h-5 w-5" />Download full results (send this file to Claude)</button>
          )}
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
