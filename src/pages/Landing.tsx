import { useEffect, useRef, useState } from 'react';
import Turnstile, { captchaEnabled, type TurnstileHandle } from '@/components/Turnstile';
import { Search, Lightbulb, Building2, Box, Video, Images, ShieldCheck, ListChecks, RefreshCw, Check, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { ApiError, claims } from '@/lib/api';
import { viewCache } from '@/lib/cache';
import { errorText } from '@/lib/errors';
import { go, href } from '@/lib/router';
import type { AppCtx } from '@/App';

export default function Landing({ ctx }: { ctx: AppCtx }) {
  const { t, lang } = useLang();
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

  return (
    <>
      <section className="hero-bg relative overflow-hidden">
        <div className="hero-overlay" />
        <div className="hero-content relative mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-20 lg:py-24">
          <div className="max-w-xl text-center sm:text-left">
            <h1 className="font-serif text-[clamp(1.75rem,6vw,2.75rem)] font-semibold leading-tight text-navy-900">{t.heroTitle}</h1>
            <p className="mt-4 text-base leading-relaxed text-navy-600 sm:text-lg">{t.heroBody}</p>
            <form onSubmit={submit} className="mt-7">
              <div className="flex flex-col gap-2 rounded-xl border border-navy-200 bg-white p-2 shadow-sm sm:flex-row">
                <label htmlFor="address" className="sr-only">{t.addressLabel}</label>
                <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t.addressPlaceholder}
                  autoComplete="street-address" maxLength={200}
                  className="w-full rounded-lg bg-transparent px-4 py-3.5 text-base text-navy-900 placeholder:text-navy-300 focus:outline-none sm:flex-1" />
                <button type="submit" disabled={!address.trim() || (needsCaptcha && !captcha)} className="btn-primary shrink-0"><Search className="h-5 w-5" />{t.scanButton}</button>
              </div>
              {needsCaptcha && <Turnstile onToken={setCaptcha} lang={lang} handle={turnstile} />}
              <p className="mt-2 text-xs text-navy-400">{t.heroHint}</p>
              {promo && (
                <p className="mt-2 inline-block rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-800">
                  {t.promoLanding.replace('{total}', promo.total.toLocaleString(lang === 'es' ? 'es-US' : 'en-US')).replace('{left}', promo.left.toLocaleString(lang === 'es' ? 'es-US' : 'en-US'))}
                </p>
              )}
              {error && (
                <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                  {errorCode === 'limit_anon' && <> <a className="link" href={href({ name: 'signin', next: '#/' })}>{t.navSignIn}</a></>}
                </p>
              )}
            </form>
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-navy-500 sm:justify-start">
              <Lightbulb className="h-4 w-4 shrink-0 text-navy-400" />{t.heroTip}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 sm:px-6">
        <h2 className="section-title">{t.howTitle}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Search, title: t.how1Title, body: t.how1Body },
            { icon: ShieldCheck, title: t.how2Title, body: t.how2Body },
            { icon: ListChecks, title: t.how3Title, body: t.how3Body },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-100 text-sage-700"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold text-navy-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-navy-100 bg-cream-50">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-14 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="section-title">{t.coverageTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-navy-500">{t.coverageBody}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['Zillow', 'Redfin', 'Realtor.com', 'Trulia', 'Homes.com', 'Movoto', 'Estately', 'HAR.com', 'Compass', 'Coldwell Banker', 'Century 21', 'RE/MAX', 'Keller Williams', "Sotheby's", 'Matterport', 'iGUIDE', 'Aryeo', 'HD Photo Hub', 'Tourbuzz', 'YouTube', 'Vimeo', 'Facebook', 'Instagram', 'Pinterest', 'Apartments.com', 'HotPads'].map((s) => (
                <span key={s} className="chip bg-white">{s}</span>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-navy-600 sm:grid-cols-4">
              {[{ i: Building2, l: t.mListing }, { i: Images, l: t.mPhotos }, { i: Box, l: t.mTour }, { i: Video, l: t.mVideo }].map(({ i: I, l }) => (
                <div key={l} className="flex items-center gap-2"><I className="h-4 w-4 text-sage-600" />{l}</div>
              ))}
            </div>
          </div>
          <div className="card self-start">
            <h2 className="font-serif text-lg font-semibold text-navy-900">{t.whyTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy-500">{t.whyBody}</p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-sage-700"><RefreshCw className="h-4 w-4" />{t.monitorTitle}</div>
          </div>
        </div>
      </section>
    </>
  );
}

function Scanning({ address }: { address: string }) {
  const { t } = useLang();
  const stages = [t.scanStage1, t.scanStage2, t.scanStage3, t.scanStage4, t.scanStage5];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, stages.length - 1)), 2200);
    return () => clearInterval(id);
  }, [stages.length]);
  return (
    <section className="mx-auto max-w-xl px-5 py-16 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-sage-700">{t.scanningTitle}</p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-navy-900 sm:text-3xl">{address}</h1>
      <ol className="mt-8 space-y-4" aria-live="polite">
        {stages.map((s, i) => (
          <li key={s} className={`flex items-start gap-3 text-sm transition-opacity ${i > step ? 'opacity-40' : ''}`}>
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${i < step ? 'bg-sage-600 text-white' : 'border border-navy-200 bg-white'}`}>
              {i < step ? <Check className="h-3 w-3" /> : i === step ? <Loader2 className="h-3 w-3 animate-spin text-sage-600" /> : null}
            </span>
            <span className="text-navy-700">{s}</span>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-xs text-navy-400">{t.scanNote}</p>
    </section>
  );
}
