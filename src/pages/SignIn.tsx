import { useEffect, useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { errorText } from '@/lib/errors';
import type { AppCtx } from '@/App';

export default function SignIn({ ctx, next }: { ctx: AppCtx; next?: string }) {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [google, setGoogle] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const target = next && next.startsWith('#/') && !next.startsWith('#/signin') ? next : '#/homes';

  useEffect(() => {
    if (ctx.user) window.location.hash = target;
  }, [ctx.user, target]);

  useEffect(() => {
    let live = true;
    ctx.api.googleEnabled().then((on) => live && setGoogle(on)).catch(() => {});
    return () => { live = false; };
  }, [ctx.api]);

  const withGoogle = async () => {
    setError(null);
    setLeaving(true);
    try {
      await ctx.api.signInWithGoogle(target);
    } catch (err) {
      setError(errorText(err, t));
      setLeaving(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setState('sending');
    try {
      await ctx.api.sendMagicLink(email.trim(), target);
      setState('sent');
    } catch (err) {
      setError(errorText(err, t));
      setState('idle');
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:py-24">
      <div className="card p-6 sm:p-8">
        <h1 className="font-serif text-2xl font-semibold text-navy-900">{t.signInTitle}</h1>
        <p className="mt-2 text-sm text-navy-500">{ctx.api.mode === 'demo' ? t.demoSignIn : google ? t.signInBodyGoogle : t.signInBody}</p>
        {google && state !== 'sent' && (
          <>
            <button type="button" onClick={withGoogle} disabled={leaving} className="btn-secondary mt-6 w-full">
              {leaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleMark />}{t.googleSignIn}
            </button>
            <div className="mt-5 flex items-center gap-3 text-xs text-navy-400" aria-hidden="true">
              <span className="h-px flex-1 bg-navy-100" />{t.orEmail}<span className="h-px flex-1 bg-navy-100" />
            </div>
          </>
        )}
        {state === 'sent' ? (
          <p className="mt-6 rounded-lg bg-sage-50 p-4 text-sm text-sage-800">{t.linkSent}</p>
        ) : (
          <form onSubmit={submit} className={`${google ? 'mt-4' : 'mt-6'} space-y-3`}>
            <label className="block text-sm font-medium text-navy-700">{t.emailLabel}
              <input type="email" required={ctx.api.mode === 'live'} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="input-field mt-1" />
            </label>
            <button type="submit" disabled={state === 'sending'} className="btn-primary w-full">
              {state === 'sending' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}{t.sendLink}
            </button>
          </form>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}

// Google's standard "G" mark, as Google asks sign-in buttons to show it.
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
