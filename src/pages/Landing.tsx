import { useEffect, useRef, useState } from 'react';
import Turnstile, { captchaEnabled, type TurnstileHandle } from '@/components/Turnstile';
import { Search, Lightbulb, Building2, Box, Video, Images, ShieldCheck, ListChecks, RefreshCw, Check, Loader2, Lock, EyeOff, Languages, Sparkles } from 'lucide-react';
import { DESIGN } from '@/i18n/design';
import { useLang } from '@/lib/i18n';
import { ApiError, claims } from '@/lib/api';
import { viewCache } from '@/lib/cache';
import { errorText } from '@/lib/errors';
import { go, href } from '@/lib/router';
import type { AppCtx } from '@/App';

export default function Landing({ ctx }: { ctx: AppCtx }) {
  const { t, lang } = useLang();
  const d = DESIGN[lang];
  const [address, setAddress] = useState('');
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const turnstile = useRef<TurnstileHandle | null>(null);
  const needsCaptcha = captchaEnabled && ctx.api.mode === 'live';
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promo, setPromo] = useState<{ left: number; total: number } | null>(null);
  useEffect(() => { ctx.api.promo().then((p) => setPromo(p && p.left > 0 ? p : null)).catch(() => {}); }, [ctx.api]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || (needsCaptcha && !captcha)) return;
    setError(null);
    setErrorCode(null);
    setScanning(true);
    try {
      const { view, claimToken } = await ctx.api.scan(address.trim(), captcha);
      if (claimToken) claims.set(view.id, claimToken);
      viewCache.set(view.id, view);
      go({ name: 'report', id: view.id });
    } catch (err) {
      setError(errorText(err, t));
      setErrorCode(err instanceof ApiError ? err.code : null);
      setScanning(false);
      turnstile.current?.reset(); // tokens are single-use
    }
  };

  if (scanning) return <Scanning address={address} />;

  const fmt = (x: number) => x.toLocaleString(lang === 'es' ? 'es-US' : 'en-US');

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-glow absolute inset-0" />
        <div className="grid-bg absolute inset-0" />
        <div className="safe-x relative mx-auto grid max-w-6xl items-center gap-10 pb-12 pt-8 sm:px-6 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-20 lg:pt-20">
          <div className="fade-in">
            <p className="inline-flex items-center gap-2 rounded-full border border-sage-200 bg-white/80 px-3 py-1 shadow-sm">
              <span className="pulse-dot h-2 w-2 rounded-full bg-sage-500" />
              <span className="eyebrow">{d.eyebrow}</span>
            </p>
            <h1 className="mt-4 font-display text-[clamp(2rem,8.5vw,3.4rem)] font-extrabold leading-[1.05] tracking-tight text-navy-900">{t.heroTitle}</h1>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-navy-600 sm:text-lg">{t.heroBody}</p>

            <form onSubmit={submit} className="mt-7 max-w-xl">
              <div className="rounded-2xl border border-navy-200 bg-white p-2 shadow-lift transition focus-within:border-sage-400 focus-within:shadow-glow">
                <label htmlFor="address" className="sr-only">{t.addressLabel}</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex flex-1 items-center gap-2.5 px-3">
                    <Search className="h-5 w-5 shrink-0 text-navy-300" />
                    <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t.addressPlaceholder}
                      autoComplete="street-address" maxLength={200} enterKeyHint="search"
                      className="w-full min-w-0 bg-transparent py-3.5 text-base text-navy-900 placeholder:text-navy-300 focus:outline-none" />
                  </div>
                  <button type="submit" disabled={!address.trim() || (needsCaptcha && !captcha)} className="btn-primary shrink-0">{t.scanButton}</button>
                </div>
              </div>
              {needsCaptcha && <Turnstile onToken={setCaptcha} lang={lang} handle={turnstile} />}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-xs text-navy-500">{t.heroHint}</p>
                {promo && (
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-sage-600 px-2.5 py-1 text-xs font-semibold text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t.promoLanding.replace('{total}', fmt(promo.total)).replace('{left}', fmt(promo.left))}
                  </p>
                )}
              </div>
              {error && (
                <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                  {errorCode === 'limit_anon' && <> <a className="link" href={href({ name: 'signin', next: '#/' })}>{t.navSignIn}</a></>}
                </p>
              )}
            </form>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium text-navy-600">
              {[{ i: Lock, l: d.trust1 }, { i: EyeOff, l: d.trust2 }, { i: Languages, l: d.trust3 }].map(({ i: I, l }) => (
                <li key={l} className="flex items-center gap-1.5"><I className="h-4 w-4 text-sage-600" />{l}</li>
              ))}
            </ul>
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* Tip strip */}
      <section className="border-y border-navy-100 bg-white">
        <p className="safe-x mx-auto flex max-w-6xl items-start gap-3 py-4 text-sm text-navy-600 sm:items-center sm:px-6">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Lightbulb className="h-4 w-4" /></span>
          {t.heroTip}
        </p>
      </section>

      {/* How it works */}
      <section className="safe-x mx-auto max-w-6xl py-14 sm:px-6 sm:py-20">
        <h2 className="section-title">{t.howTitle}</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
          {[
            { icon: Search, title: t.how1Title, body: t.how1Body },
            { icon: ShieldCheck, title: t.how2Title, body: t.how2Body },
            { icon: ListChecks, title: t.how3Title, body: t.how3Body },
          ].map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="card relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-50 text-sage-700 ring-1 ring-sage-100"><Icon className="h-5 w-5" /></div>
                <span className="num text-xs font-semibold text-navy-300">{d.stepLabel} 0{i + 1}</span>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-navy-900">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-navy-500">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Coverage */}
      <section className="bg-white">
        <div className="safe-x mx-auto grid max-w-6xl gap-10 py-14 sm:px-6 sm:py-20 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="eyebrow">{d.sitesCount}</p>
            <h2 className="section-title mt-2">{t.coverageTitle}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-navy-500">{t.coverageBody}</p>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[{ i: Building2, l: t.mListing }, { i: Images, l: t.mPhotos }, { i: Box, l: t.mTour }, { i: Video, l: t.mVideo }].map(({ i: I, l }) => (
                <div key={l} className="flex items-center gap-2 rounded-xl border border-navy-100 bg-cream-50 px-3 py-2.5 text-sm font-medium text-navy-700"><I className="h-4 w-4 shrink-0 text-sage-600" />{l}</div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {SITES.map((s) => <span key={s} className="chip bg-white font-mono text-[11px]">{s}</span>)}
            </div>
          </div>
          <div className="self-start rounded-2xl bg-navy-900 p-6 text-white shadow-lift">
            <h2 className="font-display text-xl font-bold">{t.whyTitle}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-navy-200">{t.whyBody}</p>
            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm font-semibold text-sage-300"><RefreshCw className="h-4 w-4" />{t.monitorTitle}</div>
          </div>
        </div>
      </section>
    </>
  );
}

const SITES = ['Zillow', 'Redfin', 'Realtor.com', 'Trulia', 'Homes.com', 'Movoto', 'Estately', 'HAR.com', 'Compass', 'Coldwell Banker', 'Century 21', 'RE/MAX', 'Keller Williams', "Sotheby's", 'Matterport', 'iGUIDE', 'Aryeo', 'HD Photo Hub', 'Tourbuzz', 'YouTube', 'Vimeo', 'Facebook', 'Instagram', 'Pinterest', 'Apartments.com', 'HotPads'];

/** The hero photo inside a scan frame, with illustrative "found" chips. Decorative only. */
function HeroVisual() {
  const { t, lang } = useLang();
  const d = DESIGN[lang];
  const chips = [
    { site: 'zillow.com', what: `32 ${d.samplePhotos}`, icon: Images, cls: 'left-3 top-4 sm:-left-6 sm:top-8', delay: '0.3s' },
    { site: 'matterport.com', what: d.sampleTour, icon: Box, cls: 'right-3 top-[38%] sm:-right-6', delay: '0.6s' },
    { site: 'youtube.com', what: d.sampleVideo, icon: Video, cls: 'left-3 bottom-16 sm:-left-8 sm:bottom-20', delay: '0.9s' },
  ];
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div className="scan-frame">
        <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-navy-100 shadow-lift ring-1 ring-navy-900/5" style={{ ['--h' as string]: '100%' }}>
          <img src="/assets/hero.png" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/50 via-transparent to-transparent" />
          <div className="scan-line" style={{ animationDelay: '0.4s' }} />
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl bg-white/95 px-3.5 py-2.5 shadow-soft backdrop-blur">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-400">{d.sampleLabel}</p>
              <p className="text-sm font-semibold text-navy-900"><span className="num">10</span> {d.sampleFound}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-sage-50 px-2 py-1 font-mono text-[11px] font-semibold text-sage-700"><Check className="h-3.5 w-3.5" />{t.exact}</span>
          </div>
        </div>
      </div>
      {chips.map(({ site, what, icon: I, cls, delay }) => (
        <div key={site} className={`float-in absolute ${cls} flex items-center gap-2 rounded-xl border border-navy-100 bg-white/95 py-1.5 pl-1.5 pr-3 shadow-lift backdrop-blur`} style={{ animationDelay: delay }}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sage-50 text-sage-700"><I className="h-4 w-4" /></span>
          <span className="leading-tight">
            <span className="block font-mono text-[11px] font-semibold text-navy-900">{site}</span>
            <span className="block text-[11px] text-navy-500">{what}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Scanning({ address }: { address: string }) {
  const { t, lang } = useLang();
  const d = DESIGN[lang];
  const stages = [t.scanStage1, t.scanStage2, t.scanStage3, t.scanStage4, t.scanStage5];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, stages.length - 1)), 2200);
    return () => clearInterval(id);
  }, [stages.length]);
  return (
    <section className="safe-x mx-auto max-w-xl py-10 sm:py-20">
      <div className="card overflow-hidden p-0">
        <div className="relative flex items-center gap-4 border-b border-navy-100 bg-cream-50 p-5">
          <div className="radar relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-1 ring-sage-200">
            <div className="radar-sweep absolute inset-0 rounded-full" />
            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sage-500" />
          </div>
          <div className="min-w-0">
            <p className="eyebrow">{t.scanningTitle}</p>
            <h1 className="mt-1 font-display text-lg font-bold leading-snug text-navy-900 sm:text-xl">{address}</h1>
          </div>
        </div>
        <ol className="space-y-1 p-3 sm:p-4" aria-live="polite">
          {stages.map((s, i) => (
            <li key={s} className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition ${i === step ? 'bg-sage-50' : ''} ${i > step ? 'opacity-40' : ''}`}>
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${i < step ? 'bg-sage-600 text-white' : i === step ? 'bg-white ring-1 ring-sage-300' : 'border border-navy-200 bg-white'}`}>
                {i < step ? <Check className="h-3 w-3" /> : i === step ? <Loader2 className="h-3 w-3 animate-spin text-sage-600" /> : null}
              </span>
              <span className={i === step ? 'font-medium text-navy-900' : 'text-navy-600'}>{s}</span>
            </li>
          ))}
        </ol>
        <div className="border-t border-navy-100 px-5 py-4">
          <p className="text-xs text-navy-500">{d.scanSub}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SITES.slice(0, 12).map((s, i) => (
              <span key={s} className={`chip font-mono text-[11px] transition ${i < (step + 1) * 3 ? 'border-sage-200 bg-sage-50 text-sage-800' : ''}`}>{s}</span>
            ))}
          </div>
          <p className="mt-4 text-xs text-navy-400">{t.scanNote}</p>
        </div>
      </div>
    </section>
  );
}
