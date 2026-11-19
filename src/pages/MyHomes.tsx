import { useEffect, useState } from 'react';
import { ArrowRight, Home, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { href } from '@/lib/router';
import type { MyReportSummary } from '@/lib/api';
import type { AppCtx } from '@/App';

export default function MyHomes({ ctx }: { ctx: AppCtx }) {
  const { t, lang } = useLang();
  const [rows, setRows] = useState<MyReportSummary[] | null>(null);
  useEffect(() => {
    if (!ctx.user) { window.location.hash = href({ name: 'signin', next: '#/homes' }); return; }
    ctx.api.mine().then(setRows).catch(() => setRows([]));
  }, [ctx.api, ctx.user]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-3xl font-semibold text-navy-900">{t.myHomesTitle}</h1>
      {!rows ? <Loader2 className="mt-10 h-6 w-6 animate-spin text-sage-600" /> : rows.length === 0 ? (
        <div className="card mt-6">
          <p className="text-navy-600">{t.myHomesEmpty}</p>
          <a href={href({ name: 'home' })} className="btn-primary mt-4 py-2.5 text-sm">{t.scanButton}</a>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((r) => (
            <a key={r.id} href={href({ name: 'report', id: r.id })} className="card group flex items-center gap-4 transition hover:border-sage-300">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-sage-700"><Home className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-navy-900">{r.display}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-navy-50">
                  <div className="h-full rounded-full bg-sage-500" style={{ width: `${r.total ? Math.round((r.removed / r.total) * 100) : 0}%` }} />
                </div>
                <p className="mt-1 text-xs text-navy-500">
                  {r.removed} / {r.total} {t.progressLabel}{r.inProgress ? ` · ${r.inProgress} ${t.stSent.toLowerCase()}` : ''}
                  {r.paidUntil ? ` · ${t.paidUntil} ${new Date(r.paidUntil).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US')}` : ''}
                  {r.monitor && r.paidUntil && r.nextScanAt ? ` · ${t.monitorOn} ${new Date(r.nextScanAt).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US')}` : ''}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-navy-300 group-hover:text-sage-600" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
