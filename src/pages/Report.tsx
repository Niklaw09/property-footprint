import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Box, Building2, CheckCircle2, ExternalLink, FileText, Images, Lock, MapPin, RefreshCw, Search, Video, X, AlertTriangle, Loader2, Mail } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { ApiError, claims, type OpenFinding, type ReportView, type TaskStatus, type ViewFinding } from '@/lib/api';
import { viewCache } from '@/lib/cache';
import { errorText } from '@/lib/errors';
import { go, href } from '@/lib/router';
import { PLAYBOOKS, playbookFor, type Playbook } from '@engine/playbooks.ts';
import type { MediaType, SiteCategory } from '@engine/sites.ts';
import PlaybookView from '@/components/PlaybookView';
import type { AppCtx } from '@/App';
import type { Strings } from '@/i18n/strings';

const CATS: SiteCategory[] = ['portal', 'tour', 'property_site', 'video', 'brokerage', 'rental', 'social', 'other'];
const MEDIA_ICON: Record<MediaType, typeof Images> = { photos: Images, tour: Box, video: Video, floorplan: FileText, listing: Building2 };

function mediaLabel(m: MediaType, t: Strings) {
  return { photos: t.mPhotos, tour: t.mTour, video: t.mVideo, floorplan: t.mFloorplan, listing: t.mListing }[m];
}
function catLabel(c: SiteCategory, t: Strings) {
  const k = `cat${c.charAt(0).toUpperCase()}${c.slice(1)}` as keyof Strings;
  return t[k] as string;
}
function statusLabel(s: TaskStatus, t: Strings) {
  return { todo: t.stTodo, sent: t.stSent, waiting: t.stWaiting, removed: t.stRemoved, cant: t.stCant }[s];
}
function fmtDate(iso: string | null, lang: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Drawer {
  pb: Playbook;
  finding?: OpenFinding;
}

export default function Report({ ctx, id }: { ctx: AppCtx; id: string }) {
  const { t, lang } = useLang();
  const [view, setView] = useState<ReportView | null>(() => viewCache.get(id) ?? null);
  const [error, setError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<Drawer | null>(null);
  const [rescanning, setRescanning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const v = await ctx.api.report(id, ctx.user ? claims.get(id) : null);
      if (v.member) claims.clear(id);
      setView(v);
      viewCache.set(id, v);
    } catch (e) {
      setError(errorText(e, t));
    }
  }, [ctx.api, ctx.user, id, t]);

  useEffect(() => { load(); }, [load]);

  const open = useMemo(() => (view?.findings.filter((f) => !f.locked) ?? []) as OpenFinding[], [view]);
  const removedCount = open.filter((f) => f.task?.status === 'removed' || f.goneVerifiedAt).length;

  if (error) return <div className="mx-auto max-w-3xl px-5 py-16 text-center text-navy-600">{error}</div>;
  if (!view) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-sage-600" /></div>;

  const signInHref = href({ name: 'signin', next: `#/r/${id}` });
  const grouped = CATS.map((c) => ({ c, items: view.findings.filter((f) => f.category === c) })).filter((g) => g.items.length);

  const setTask = async (f: OpenFinding, status: TaskStatus, note?: string) => {
    await ctx.api.task(view.id, f.id, status, note ?? f.task?.note ?? '');
    await load();
  };
  const rescan = async () => {
    setRescanning(true);
    setNotice(null);
    try {
      const v = await ctx.api.rescan(view.id);
      setView(v);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'too_soon' && e.detail) setNotice(`${t.rescanTooSoon} ${new Date(e.detail).toLocaleString(lang === 'es' ? 'es-US' : 'en-US')}`);
      else setNotice(errorText(e, t));
    } finally {
      setRescanning(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Summary */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-navy-500">{t.reportFor}</p>
          <h1 className="mt-1 flex items-start gap-2 font-serif text-2xl font-semibold text-navy-900 sm:text-3xl"><MapPin className="mt-1.5 h-5 w-5 shrink-0 text-sage-600" />{view.display}</h1>
          <p className="mt-1 text-xs text-navy-400">{t.scannedOn} {fmtDate(view.scannedAt, lang)}</p>
        </div>
        <a href={href({ name: 'home' })} className="btn-secondary self-start md:self-auto">{t.scanAnother}</a>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1.2fr_2fr]">
        <div className="card flex flex-col justify-center">
          <p className="font-serif text-5xl font-semibold text-navy-900">{view.counts.total}</p>
          <p className="mt-1 text-sm text-navy-500">{t.sourcesFound}</p>
          {view.member && view.counts.total + view.counts.gone > 0 && (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-navy-50">
                <div className="h-full rounded-full bg-sage-500 transition-all" style={{ width: `${Math.round((removedCount / Math.max(open.length, 1)) * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs text-navy-500">{removedCount} / {open.length} {t.progressLabel}</p>
            </div>
          )}
        </div>
        <div className="card grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['photos', 'tour', 'video', 'floorplan'] as MediaType[]).map((m) => {
            const Icon = MEDIA_ICON[m];
            return (
              <div key={m}>
                <Icon className="h-5 w-5 text-sage-600" />
                <p className="mt-2 text-2xl font-semibold text-navy-900">{view.counts.byMedia[m] ?? 0}</p>
                <p className="text-xs text-navy-500">{mediaLabel(m, t)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {!view.member && view.counts.total > 1 && (
        <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-sage-200 bg-sage-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-navy-700">{t.lockedBody}</p>
          <a href={signInHref} className="btn-primary shrink-0 py-2.5 text-sm">{t.lockedCta}<ArrowRight className="h-4 w-4" /></a>
        </div>
      )}

      {view.counts.total === 0 && (
        <div className="card mt-6">
          <CheckCircle2 className="h-6 w-6 text-sage-600" />
          <h2 className="mt-2 font-semibold text-navy-900">{t.noneFoundTitle}</h2>
          <p className="mt-1 text-sm text-navy-500">{t.noneFoundBody}</p>
        </div>
      )}

      {/* Start here */}
      {view.counts.total > 0 && (
        <div className="mt-8 rounded-xl bg-navy-800 p-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h2 className="font-serif text-lg font-semibold">{t.startHereTitle}</h2>
            <p className="mt-1 text-sm text-navy-100">{t.startHereBody}</p>
          </div>
          <button onClick={() => setDrawer({ pb: PLAYBOOKS.mls })} className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-navy-800 hover:bg-cream-100 sm:mt-0">
            <Mail className="h-4 w-4" />{t.startHereCta}
          </button>
        </div>
      )}

      {/* Findings */}
      {grouped.map(({ c, items }) => (
        <section key={c} className="mt-10">
          <h2 className="section-title">{catLabel(c, t)} <span className="ml-1 text-base font-normal text-navy-400">{items.length}</span></h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {items.map((f) => f.locked
              ? <LockedCard key={f.id} f={f} signInHref={signInHref} />
              : <FindingCard key={f.id} f={f} member={view.member} onRemove={() => setDrawer({ pb: playbookFor(f.coveredBy ?? f.playbook), finding: f })} onStatus={(s) => setTask(f, s)} />)}
          </div>
        </section>
      ))}

      {/* Quick checks */}
      {view.checks.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title">{t.quickChecksTitle}</h2>
          <p className="mt-1 text-sm text-navy-500">{t.quickChecksBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {view.checks.map((c) => (
              <a key={c.siteKey} href={c.url} target="_blank" rel="noopener noreferrer" className="btn-secondary py-2"><Search className="h-4 w-4" />{c.siteName}</a>
            ))}
          </div>
        </section>
      )}

      {/* Search engines */}
      <section className="mt-10">
        <h2 className="section-title">{t.searchEnginesTitle}</h2>
        <p className="mt-1 text-sm text-navy-500">{t.searchEnginesBody}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {['google', 'bing', 'streetview'].map((k) => (
            <button key={k} onClick={() => setDrawer({ pb: PLAYBOOKS[k] })} className="card text-left transition hover:border-sage-300">
              <p className="font-semibold text-navy-900">{PLAYBOOKS[k].name}</p>
              <p className="mt-1 line-clamp-3 text-sm text-navy-500">{PLAYBOOKS[k].outcome[lang]}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sage-700">{t.howToRemove}<ArrowRight className="h-4 w-4" /></span>
            </button>
          ))}
        </div>
      </section>

      {/* Monitoring */}
      {view.member && (
        <section className="mt-10 grid gap-3 md:grid-cols-2">
          <div className="card">
            <h2 className="flex items-center gap-2 font-semibold text-navy-900"><RefreshCw className="h-4 w-4 text-sage-600" />{t.monitorTitle}</h2>
            <label className="mt-3 flex items-center gap-2 text-sm text-navy-700">
              <input type="checkbox" checked={view.monitor !== false} onChange={async (e) => { await ctx.api.membership(view.id, { monitor: e.target.checked }); load(); }} className="h-4 w-4 accent-sage-600" />
              {view.monitor !== false ? `${t.monitorOn} ${fmtDate(view.nextScanAt, lang)}` : t.monitorOff}
            </label>
            <button onClick={rescan} disabled={rescanning} className="btn-secondary mt-4 py-2">
              {rescanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{t.rescanNow}
            </button>
            {notice && <p className="mt-2 text-xs text-navy-500">{notice}</p>}
          </div>
          <div className="card">
            <h2 className="font-semibold text-navy-900">{t.historyTitle}</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-navy-600">
              {view.history.map((h) => (
                <li key={h.at} className="flex justify-between gap-2">
                  <span>{fmtDate(h.at, lang)}</span>
                  <span>{h.found} {t.historyFound}{h.newCount ? ` · +${h.newCount} ${t.historyNew}` : ''}{h.goneCount ? ` · ${h.goneCount} ${t.historyGone}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {drawer && (
        <RemovalDrawer
          drawer={drawer}
          view={view}
          onClose={() => setDrawer(null)}
          onOwnerName={(n) => view.member && ctx.api.membership(view.id, { ownerName: n })}
          onSave={view.member && drawer.finding ? async (s, note) => { await setTask(drawer.finding!, s, note); setDrawer(null); } : undefined}
          signInHref={!view.member ? signInHref : undefined}
        />
      )}
    </div>
  );
}

function Evidence({ f }: { f: OpenFinding }) {
  const { t } = useLang();
  const parts: string[] = [];
  if (f.evidence.includes('portal_lookup')) parts.push(t.evLookup);
  if (f.evidence.includes('street')) parts.push(t.evStreet);
  if (f.evidence.includes('unit')) parts.push(t.evUnit);
  if (f.evidence.includes('zip')) parts.push(t.evZip);
  else if (f.evidence.includes('city')) parts.push(t.evCity);
  const warn = f.evidence.includes('other_unit') ? t.evOtherUnit : f.evidence.includes('unit_missing') ? t.evUnitMissing : null;
  return (
    <p className="mt-2 text-xs text-navy-500">
      <span className="font-medium text-navy-600">{t.evidence}:</span> {parts.join(', ')}.
      {warn && <span className="ml-1 text-amber-700">{warn}.</span>}
    </p>
  );
}

function FindingCard({ f, member, onRemove, onStatus }: { f: OpenFinding; member: boolean; onRemove: () => void; onStatus: (s: TaskStatus) => void }) {
  const { t } = useLang();
  const done = f.task?.status === 'removed' || !!f.goneVerifiedAt;
  return (
    <div className={`card flex flex-col ${done ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-semibold text-navy-900">{f.siteName}</p>
            {f.preview && !member && <span className="rounded-full bg-sage-600 px-2 py-0.5 text-[11px] font-medium text-white">{t.previewBadge}</span>}
            {f.confidence === 'exact'
              ? <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[11px] font-medium text-sage-800">{t.exact}</span>
              : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">{t.likely}</span>}
          </div>
          <p className="mt-0.5 truncate text-xs text-navy-400">{f.domain}</p>
        </div>
        {f.thumbnails[0] && <img src={f.thumbnails[0]} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-14 w-20 shrink-0 rounded-md object-cover ring-1 ring-navy-100" />}
      </div>
      {f.title && <p className="mt-2 line-clamp-2 text-sm text-navy-700">{f.title}</p>}
      <div className="mt-2 flex flex-wrap gap-1">
        {f.media.filter((m) => m !== 'listing').map((m) => <span key={m} className="chip">{mediaLabel(m, t)}</span>)}
      </div>
      <Evidence f={f} />
      {f.confidence === 'likely' && <p className="mt-1 flex items-start gap-1 text-xs text-amber-700"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{t.likelyHelp}</p>}
      {f.coveredBy && <p className="mt-1 text-xs text-sage-700">{t.coveredBy}</p>}
      {!f.stillFound && <p className="mt-1 text-xs font-medium text-sage-700">{f.goneVerifiedAt ? t.goneVerified : t.gone}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-navy-50 pt-3">
        <a href={f.url} target="_blank" rel="noopener noreferrer" className="btn-secondary px-3 py-1.5 text-xs"><ExternalLink className="h-3.5 w-3.5" />{t.viewPage}</a>
        <button onClick={onRemove} className="inline-flex items-center gap-1.5 rounded-lg bg-sage-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-sage-800">{t.howToRemove}<ArrowRight className="h-3.5 w-3.5" /></button>
        {member && (
          <select aria-label={t.statusLabel} value={f.task?.status ?? 'todo'} onChange={(e) => onStatus(e.target.value as TaskStatus)}
            className="ml-auto rounded-lg border border-navy-200 bg-white px-2 py-1.5 text-xs text-navy-700">
            {(['todo', 'sent', 'waiting', 'removed', 'cant'] as TaskStatus[]).map((s) => <option key={s} value={s}>{statusLabel(s, t)}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

function LockedCard({ f, signInHref }: { f: Extract<ViewFinding, { locked: true }>; signInHref: string }) {
  const { t } = useLang();
  return (
    <a href={signInHref} className="card group flex flex-col border-dashed transition hover:border-sage-300">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-navy-900">{f.siteName}</p>
        <Lock className="h-4 w-4 text-navy-300 group-hover:text-sage-600" />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {f.media.filter((m) => m !== 'listing').map((m) => <span key={m} className="chip">{mediaLabel(m, t)}</span>)}
      </div>
      <p className="mt-3 text-xs font-medium text-sage-700">{t.lockedTitle}</p>
    </a>
  );
}

function RemovalDrawer({ drawer, view, onClose, onOwnerName, onSave, signInHref }: {
  drawer: Drawer; view: ReportView; onClose: () => void; onOwnerName: (n: string) => void;
  onSave?: (s: TaskStatus, note: string) => Promise<void>; signInHref?: string;
}) {
  const { t } = useLang();
  const f = drawer.finding;
  const [status, setStatus] = useState<TaskStatus>(f?.task?.status ?? 'todo');
  const [note, setNote] = useState(f?.task?.note ?? '');
  const allUrls = (view.findings.filter((x) => !x.locked) as OpenFinding[]).map((x) => x.url);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy-950/40" onClick={onClose} role="dialog" aria-modal="true">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-xl sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-navy-400">{t.howToRemove}</p>
            <h2 className="font-serif text-xl font-semibold text-navy-900">{f?.siteName ?? drawer.pb.name}</h2>
            {f && <a href={f.url} target="_blank" rel="noopener noreferrer" className="link mt-1 flex max-w-full items-center gap-1 text-xs"><span className="truncate">{f.url}</span><ExternalLink className="h-3 w-3 shrink-0" /></a>}
          </div>
          <button onClick={onClose} aria-label={t.close} className="rounded-md p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5">
          <PlaybookView pb={drawer.pb} address={view.display} siteName={f?.siteName}
            urls={f ? [f.url] : drawer.pb.key === 'mls' ? allUrls : []} ownerName={view.ownerName} onOwnerName={onOwnerName} />
        </div>
        {f && onSave && (
          <div className="mt-6 rounded-xl border border-navy-100 p-4">
            <label className="text-xs font-medium text-navy-600">{t.statusLabel}
              <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="mt-1 w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm">
                {(['todo', 'sent', 'waiting', 'removed', 'cant'] as TaskStatus[]).map((s) => <option key={s} value={s}>{statusLabel(s, t)}</option>)}
              </select>
            </label>
            <label className="mt-3 block text-xs font-medium text-navy-600">{t.noteLabel}
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-navy-200 px-3 py-2 text-sm" />
            </label>
            <button onClick={() => onSave(status, note)} className="btn-primary mt-3 py-2.5 text-sm">{t.save}</button>
          </div>
        )}
        {signInHref && f && (
          <a href={signInHref} onClick={() => go({ name: 'signin', next: `#/r/${view.id}` })} className="btn-primary mt-6 w-full text-sm">{t.lockedCta}</a>
        )}
      </div>
    </div>
  );
}
