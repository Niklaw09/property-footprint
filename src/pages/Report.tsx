import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Box, Building2, CheckCircle2, ExternalLink, FileText, Images, Lock, MapPin, RefreshCw, Search, Video, X, AlertTriangle, Loader2, Mail } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { ApiError, claims, type OpenFinding, type ReportView, type TaskStatus, type ViewFinding } from '@/lib/api';
import { viewCache } from '@/lib/cache';
import { errorText } from '@/lib/errors';
import { go, href } from '@/lib/router';
import { siteLabel } from '@/lib/siteLabel';
import { PLAYBOOKS, playbookFor, playbookName, type Playbook } from '@engine/playbooks.ts';
import type { MediaType, SiteCategory } from '@engine/sites.ts';
import PlaybookView from '@/components/PlaybookView';
import type { AppCtx } from '@/App';
import type { Strings } from '@/i18n/strings';

const CATS: SiteCategory[] = ['portal', 'tour', 'property_site', 'video', 'brokerage', 'rental', 'social', 'other'];
const COLLAPSE_AFTER = 6;
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
  const [buying, setBuying] = useState(false);
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});

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

  const unlock = async (plan: 'quick' | 'monitor' = 'monitor') => {
    if (!ctx.user) { go({ name: 'signin', next: `#/r/${id}` }); return; }
    setBuying(true);
    setNotice(null);
    try {
      if (promoOpen(view)) {
        const v = await ctx.api.claimPromo(view.id, lang);
        claims.clear(view.id);
        setView(v);
        setBuying(false);
        return;
      }
      const url = await ctx.api.checkout(view.id, lang, plan);
      if (url.startsWith('#')) { window.location.hash = url; await load(); setBuying(false); } else window.location.href = url;
    } catch (e) {
      setNotice(errorText(e, t));
      setBuying(false);
    }
  };
  // Named sites first; within a group, exact matches before possible ones (the server already sorts by confidence).
  // Pages with no photos seen go last: there's less to remove there.
  // No photo previews: Google's picture for a portal page is often a nearby home, and the photos aren't ours to show.
  const named = (f: ViewFinding) => (f.locked ? 1 : f.siteKey.startsWith('web:') ? 1 : 0);
  const noPhotos = (f: ViewFinding) => (f.photos === 'none' ? 1 : 0);
  const grouped = CATS.map((c) => ({ c, items: view.findings.filter((f) => f.category === c).sort((a, b) => noPhotos(a) - noPhotos(b) || named(a) - named(b)) })).filter((g) => g.items.length);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">{t.reportFor}</p>
          <h1 className="mt-2 flex items-start gap-2 font-serif text-[clamp(1.5rem,6vw,2.1rem)] font-semibold leading-tight text-navy-900"><MapPin className="mt-1 h-5 w-5 shrink-0 text-sage-600 sm:mt-2" />{view.display}</h1>
          <p className="mt-1.5 text-xs text-navy-400">{t.scannedOn} {fmtDate(view.scannedAt, lang)}</p>
        </div>
        <a href={href({ name: 'home' })} className="btn-secondary self-start py-2.5 sm:self-auto"><Search className="h-4 w-4" />{t.scanAnother}</a>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-soft">
        <div className="grid sm:grid-cols-[1fr_2fr]">
          <div className="relative flex flex-col justify-center overflow-hidden border-b border-navy-100 bg-sage-50 p-5 sm:border-b-0 sm:border-r sm:p-6">
            <p className="relative num font-serif text-6xl font-semibold leading-none text-navy-900">{view.counts.total}</p>
            <p className="relative mt-2 text-sm text-navy-600">{t.sourcesFound}</p>
            {view.unlocked && view.counts.total + view.counts.gone > 0 && (
              <div className="relative mt-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-sage-500 transition-all" style={{ width: `${Math.round((removedCount / Math.max(open.length, 1)) * 100)}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-navy-500">{removedCount} / {open.length} {t.progressLabel}</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 divide-navy-100 sm:grid-cols-4 sm:divide-x">
            {(['photos', 'tour', 'video', 'floorplan'] as MediaType[]).map((m, i) => {
              const Icon = MEDIA_ICON[m];
              const n = view.counts.byMedia[m] ?? 0;
              return (
                <div key={m} className={`p-4 sm:p-5 ${i < 2 ? 'border-b border-navy-100 sm:border-b-0' : ''} ${i % 2 === 0 ? 'border-r border-navy-100 sm:border-r-0' : ''}`}>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${n ? 'bg-sage-50 text-sage-700' : 'bg-cream-100 text-navy-300'}`}><Icon className="h-4 w-4" /></span>
                  <p className={`num mt-3 text-2xl font-semibold ${n ? 'text-navy-900' : 'text-navy-300'}`}>{n}</p>
                  <p className="text-xs text-navy-500">{mediaLabel(m, t)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!view.unlocked && view.counts.total > 0 && (
        <PriceCard view={view} signedIn={!!ctx.user} buying={buying} onUnlock={(p) => unlock(p)} notice={notice} />
      )}
      {view.unlocked && view.paidUntil && (
        <p className="mt-3 text-xs text-navy-500">{view.plan === 'quick' ? t.quickUntil : t.paidUntil} {fmtDate(view.paidUntil, lang)}</p>
      )}
      {view.unlocked && view.plan === 'quick' && view.upgradeCents != null && (
        <div className="mt-4 rounded-xl border border-sage-200 bg-sage-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h2 className="font-semibold text-navy-900">{t.upgradeTitle}</h2>
            <p className="mt-1 text-sm text-navy-600">{t.upgradeBody.replace('{price}', money(view.upgradeCents))}</p>
            {notice && <p className="mt-2 text-xs text-red-700">{notice}</p>}
          </div>
          <button onClick={() => unlock('monitor')} disabled={buying} className="btn-primary mt-4 shrink-0 sm:mt-0">
            {buying ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{t.upgradeCta.replace('{price}', money(view.upgradeCents))}
          </button>
        </div>
      )}
      {view.unlocked && view.review && <ReviewCard view={view} ctx={ctx} started={view.findings.some((f) => !f.locked && f.task && f.task.status !== 'todo')} />}

      {view.counts.total === 0 && (
        <div className="card mt-6">
          <CheckCircle2 className="h-6 w-6 text-sage-600" />
          <h2 className="mt-2 font-semibold text-navy-900">{t.noneFoundTitle}</h2>
          <p className="mt-1 text-sm text-navy-500">{t.noneFoundBody}</p>
        </div>
      )}

      {/* Findings */}
      {grouped.map(({ c, items }) => {
        // Agent sites can run to dozens of pages that all copy the MLS listing: show a few, explain the shortcut.
        const cap = c === 'brokerage' && items.length > COLLAPSE_AFTER && !showAll[c] ? COLLAPSE_AFTER : items.length;
        return (
        <section key={c} className="mt-10">
          <h2 className="section-title">{catLabel(c, t)} <span className="num ml-1.5 rounded-md bg-navy-50 px-1.5 py-0.5 align-middle text-xs font-semibold text-navy-500">{items.length}</span></h2>
          {c === 'brokerage' && items.length > 3 && (
            <p className="mt-1 text-sm text-navy-500">
              {t.agentSitesNote}{' '}
              <button onClick={() => setDrawer({ pb: PLAYBOOKS.mls })} className="font-medium text-sage-700 underline underline-offset-2">{t.startHereCta}</button>
            </p>
          )}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {items.slice(0, cap).map((f) => f.locked
              ? <LockedCard key={f.id} f={f} onUnlock={() => unlock()} />
              : <FindingCard key={f.id} f={f} member={view.unlocked} onRemove={() => setDrawer({ pb: playbookFor(f.coveredBy ?? f.playbook), finding: f })} onStatus={(s) => setTask(f, s)} />)}
          </div>
          {cap < items.length && (
            <button onClick={() => setShowAll((s) => ({ ...s, [c]: true }))} className="btn-secondary mt-3 w-full py-2 sm:w-auto">
              {t.showAllSites.replace('{n}', String(items.length))}
            </button>
          )}
        </section>
        );
      })}

      {/* Did you start here? (the listing agent): a gentle shortcut, after the results */}
      {view.counts.total > 0 && (
        <section className="mt-10 card sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h2 className="font-semibold text-navy-900">{t.startHereTitle}</h2>
            <p className="mt-1 text-sm text-navy-500">{t.startHereBody}</p>
          </div>
          <button onClick={() => setDrawer({ pb: PLAYBOOKS.mls })} className="btn-secondary mt-4 shrink-0 py-2 sm:mt-0">
            <Mail className="h-4 w-4" />{t.startHereCta}
          </button>
        </section>
      )}

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
              <p className="font-semibold text-navy-900">{playbookName(PLAYBOOKS[k], lang)}</p>
              <p className="mt-1 line-clamp-3 text-sm text-navy-500">{PLAYBOOKS[k].outcome[lang]}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sage-700">{t.howToRemove}<ArrowRight className="h-4 w-4" /></span>
            </button>
          ))}
        </div>
      </section>

      {/* Monitoring (12-month plan) */}
      {view.unlocked && view.plan !== 'quick' && (
        <section className="mt-10 grid gap-3 md:grid-cols-2">
          <div className="card">
            <h2 className="flex items-center gap-2 font-semibold text-navy-900"><RefreshCw className="h-4 w-4 text-sage-600" />{t.monitorTitle}</h2>
            <label className="mt-3 flex items-center gap-2 text-sm text-navy-700">
              <input type="checkbox" checked={view.monitor !== false} onChange={async (e) => { await ctx.api.membership(view.id, { monitor: e.target.checked }); load(); }} className="h-4 w-4 accent-sage-600" />
              {view.monitor !== false ? `${t.monitorOn} ${fmtDate(view.nextScanAt, lang)}` : t.monitorOff}
            </label>
            <p className="mt-2 text-xs text-navy-500">{t.rescansLeft}: {view.rescansLeft}</p>
            <button onClick={rescan} disabled={rescanning || view.rescansLeft === 0} className="btn-secondary mt-3 py-2">
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
          onSave={view.unlocked && drawer.finding ? async (s, note) => { await setTask(drawer.finding!, s, note); setDrawer(null); } : undefined}
          onUnlock={!view.unlocked ? () => { setDrawer(null); unlock(); } : undefined}
        />
      )}
    </div>
  );
}

function Evidence({ f }: { f: OpenFinding }) {
  const { t } = useLang();
  const parts: string[] = [];
  if (f.evidence.includes('portal_lookup')) parts.push(t.evLookup);
  if (f.evidence.includes('same_listing_id')) parts.push(t.evSameListing);
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
  const { t, lang } = useLang();
  const done = f.task?.status === 'removed' || !!f.goneVerifiedAt;
  return (
    <div className={`card flex flex-col ${done ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-semibold text-navy-900">{siteLabel(f.siteName, lang)}</p>
            {f.preview && !member && <span className="rounded-full bg-sage-600 px-2 py-0.5 text-[11px] font-medium text-white">{t.previewBadge}</span>}
            {f.confidence === 'exact'
              ? <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[11px] font-medium text-sage-800">{t.exact}</span>
              : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">{t.likely}</span>}
            {f.photos === 'seen' && <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-medium text-navy-700">{t.photosSeen}</span>}
            {f.photos === 'none' && <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-medium text-navy-400">{t.photosNone}</span>}
          </div>
          <p className="mt-0.5 truncate text-xs text-navy-400">{f.domain}</p>
        </div>
      </div>
      {f.title && <p className="mt-2 line-clamp-2 text-sm text-navy-700">{f.title}</p>}
      {f.snippet && <p className="mt-1 line-clamp-2 text-xs text-navy-500">{f.snippet}</p>}
      <div className="mt-2 flex flex-wrap gap-1">
        {f.media.filter((m) => m !== 'listing').map((m) => <span key={m} className="chip">{mediaLabel(m, t)}</span>)}
      </div>
      <Evidence f={f} />
      {f.confidence === 'likely' && <p className="mt-1 flex items-start gap-1 text-xs text-amber-700"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{t.likelyHelp}</p>}
      {f.photos === 'none' && <p className="mt-1 text-xs text-navy-400">{t.photosNoneHelp}</p>}
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

const promoOpen = (view: ReportView) => !!view.promo && view.promo.left > 0 && !view.promo.usedByYou;

const money = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

function PriceCard({ view, signedIn, buying, onUnlock, notice }: { view: ReportView; signedIn: boolean; buying: boolean; onUnlock: (plan?: 'quick' | 'monitor') => void; notice: string | null }) {
  const { t, lang } = useLang();
  const dollars = money(view.prices.monitor);
  const quick = money(view.prices.quick);
  const free = promoOpen(view);
  const n = (x: number) => x.toLocaleString(lang === 'es' ? 'es-US' : 'en-US');
  if (free) {
    return (
      <div className="mt-4 rounded-xl border border-sage-200 bg-sage-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-sage-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            {t.promoBadge.replace('{left}', n(view.promo!.left)).replace('{total}', n(view.promo!.total))}
          </p>
          <h2 className="font-serif text-lg font-semibold text-navy-900">
            {t.promoTitle} <span className="font-sans text-base font-normal text-navy-400 line-through">{dollars}</span>
          </h2>
          <ul className="mt-2 grid gap-1 text-sm text-navy-700 sm:grid-cols-2">
            {t.priceBullets.map((b) => <li key={b} className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />{b}</li>)}
          </ul>
          <p className="mt-2 text-xs text-navy-500">{t.promoNote.replace('{total}', n(view.promo!.total))}</p>
          {notice && <p className="mt-2 text-xs text-red-700">{notice}</p>}
        </div>
        <button onClick={() => onUnlock()} disabled={buying} className="btn-primary mt-4 shrink-0 sm:mt-0">
          {buying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
          {signedIn ? t.promoCta : t.promoSignIn}
        </button>
      </div>
    );
  }
  return (
    <div className="mt-4 rounded-2xl border border-sage-200 bg-sage-50 p-4 sm:p-5">
      <h2 className="font-serif text-xl font-semibold text-navy-900">{t.plansTitle}</h2>
      <p className="mt-1 text-sm text-navy-600">{t.plansIntro}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-navy-100 bg-white p-4 sm:p-5">
          <p className="font-semibold text-navy-900">{t.quickName}</p>
          <p className="num mt-1 font-serif text-3xl font-semibold text-navy-900">{quick}</p>
          <ul className="mt-3 grid gap-1 text-sm text-navy-700">
            {t.quickBullets.map((b) => <li key={b} className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />{b}</li>)}
          </ul>
          <p className="mt-3 text-xs text-navy-500">{t.quickNote.replace('{price}', quick)}</p>
          <div className="mt-auto pt-4">
            <button onClick={() => onUnlock('quick')} disabled={buying} className="btn-secondary w-full py-2.5">
              {t.quickCta} · {quick}
            </button>
          </div>
        </div>
        <div className="flex flex-col rounded-xl border-2 border-sage-500 bg-white p-4 shadow-soft sm:p-5">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-navy-900">{t.planName}</p>
            <span className="rounded-full bg-sage-600 px-2 py-0.5 text-[11px] font-medium text-white">{t.planBadge}</span>
          </div>
          <p className="num mt-1 font-serif text-3xl font-semibold text-navy-900">{dollars}</p>
          <ul className="mt-3 grid gap-1 text-sm text-navy-700">
            {t.priceBullets.map((b) => <li key={b} className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />{b}</li>)}
          </ul>
          <button onClick={() => onUnlock('monitor')} disabled={buying} className="btn-primary mt-4 w-full">
            {buying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
            {t.planCta.replace('{price}', dollars)}
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-navy-500">{t.plansNote}{!signedIn && <> {t.signInFirst}</>}</p>
      {notice && <p className="mt-2 text-xs text-red-700">{notice}</p>}
    </div>
  );
}

/** Optional review. Shown to everyone who unlocked, after they've started on their requests. Never tied to the offer. */
function ReviewCard({ view, ctx, started }: { view: ReportView; ctx: AppCtx; started: boolean }) {
  const { t } = useLang();
  const key = `pf.review.hide.${view.id}`;
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(key) === '1'; } catch { return false; } });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'form' | 'saving' | 'done'>(view.review?.done ? 'done' : 'form');
  const [err, setErr] = useState<string | null>(null);
  if (!view.review || hidden || (!started && state !== 'done')) return null;
  if (view.review.done && !view.review.googleUrl) return null;
  const google = view.review.googleUrl;
  const hide = () => { try { localStorage.setItem(key, '1'); } catch { /* ignore */ } setHidden(true); };
  const submit = async () => {
    setState('saving');
    setErr(null);
    try { await ctx.api.review(view.id, rating, comment); setState('done'); } catch (e) { setErr(errorText(e, t)); setState('form'); }
  };
  return (
    <div className="card mt-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-serif text-lg font-semibold text-navy-900">{state === 'done' ? t.reviewThanks : t.reviewTitle}</h2>
        <button onClick={hide} aria-label={t.reviewHide} className="rounded p-1 text-navy-400 hover:text-navy-700"><X className="h-4 w-4" /></button>
      </div>
      {state !== 'done' ? (
        <>
          <p className="mt-1 text-sm text-navy-600">{t.reviewBody}</p>
          <div className="mt-3 flex gap-1" role="radiogroup" aria-label={t.reviewTitle}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n}`} onClick={() => setRating(n)}
                className={`text-2xl leading-none ${n <= rating ? 'text-amber-500' : 'text-navy-200 hover:text-amber-300'}`}>★</button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={2000} placeholder={t.reviewPlaceholder}
            className="mt-3 w-full rounded-lg border border-navy-100 bg-white p-3 text-sm text-navy-800 focus:border-sage-400 focus:outline-none" />
          {err && <p className="mt-2 text-xs text-red-700">{err}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button onClick={submit} disabled={!rating || state === 'saving'} className="btn-primary py-2 text-sm">
              {state === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}{t.reviewSend}
            </button>
            {google && <a href={google} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sage-700 underline underline-offset-2">{t.reviewGoogle}</a>}
          </div>
        </>
      ) : (
        google && (
          <p className="mt-1 text-sm text-navy-600">
            {t.reviewGoogleAsk}{' '}
            <a href={google} target="_blank" rel="noopener noreferrer" className="font-medium text-sage-700 underline underline-offset-2">{t.reviewGoogle}</a>
          </p>
        )
      )}
      <p className="mt-3 text-xs text-navy-400">{t.reviewOptional}</p>
    </div>
  );
}

function LockedCard({ f, onUnlock }: { f: Extract<ViewFinding, { locked: true }>; onUnlock: () => void }) {
  const { t, lang } = useLang();
  return (
    <button onClick={onUnlock} className="card group flex flex-col text-left transition hover:border-sage-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-semibold text-navy-900">{siteLabel(f.siteName, lang)}</p>
            {f.photos === 'seen' && <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-medium text-navy-700">{t.photosSeen}</span>}
          </div>
          <p className="mt-0.5 truncate text-xs text-navy-400">{f.domain}</p>
        </div>
        <Lock className="h-4 w-4 shrink-0 text-navy-300 group-hover:text-sage-600" />
      </div>
      {f.title && <p className="mt-2 line-clamp-2 text-sm text-navy-700">{f.title}</p>}
      {f.snippet && <p className="mt-1 line-clamp-2 text-xs text-navy-500">{f.snippet}</p>}
      <div className="mt-2 flex flex-wrap gap-1">
        {f.media.filter((m) => m !== 'listing').map((m) => <span key={m} className="chip">{mediaLabel(m, t)}</span>)}
      </div>
      <p className="mt-3 flex items-center gap-1.5 border-t border-navy-50 pt-3 text-xs font-medium text-sage-700"><Lock className="h-3.5 w-3.5" />{t.lockedTitle}</p>
    </button>
  );
}

function RemovalDrawer({ drawer, view, onClose, onOwnerName, onSave, onUnlock }: {
  drawer: Drawer; view: ReportView; onClose: () => void; onOwnerName: (n: string) => void;
  onSave?: (s: TaskStatus, note: string) => Promise<void>; onUnlock?: () => void;
}) {
  const { t, lang } = useLang();
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
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white px-5 pb-8 shadow-xl sm:px-7" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 -mx-5 flex items-start justify-between gap-4 border-b border-navy-100 bg-white/95 px-5 pb-3 pt-[max(env(safe-area-inset-top),1.25rem)] backdrop-blur sm:-mx-7 sm:px-7">
          <div className="min-w-0">
            <p className="eyebrow">{t.howToRemove}</p>
            <h2 className="font-serif text-2xl font-semibold text-navy-900">{f ? siteLabel(f.siteName, lang) : playbookName(drawer.pb, lang)}</h2>
            {f && <a href={f.url} target="_blank" rel="noopener noreferrer" className="link mt-1 flex max-w-full items-center gap-1 text-xs"><span className="truncate">{f.url}</span><ExternalLink className="h-3 w-3 shrink-0" /></a>}
          </div>
          <button onClick={onClose} aria-label={t.close} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-100 text-navy-500 hover:bg-navy-50 hover:text-navy-800"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5">
          <PlaybookView pb={drawer.pb} address={view.display} siteName={f && siteLabel(f.siteName, lang)}
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
        {onUnlock && f && (
          <button onClick={onUnlock} className="btn-primary mt-6 w-full text-sm">{t.lockedCta}</button>
        )}
      </div>
    </div>
  );
}
