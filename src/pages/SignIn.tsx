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
  const target = next && next.startsWith('#/') && !next.startsWith('#/signin') ? next : '#/homes';

  useEffect(() => {
    if (ctx.user) window.location.hash = target;
  }, [ctx.user, target]);

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
        <p className="mt-2 text-sm text-navy-500">{ctx.api.mode === 'demo' ? t.demoSignIn : t.signInBody}</p>
        {state === 'sent' ? (
          <p className="mt-6 rounded-lg bg-sage-50 p-4 text-sm text-sage-800">{t.linkSent}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-navy-700">{t.emailLabel}
              <input type="email" required={ctx.api.mode === 'live'} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="input-field mt-1" />
            </label>
            <button type="submit" disabled={state === 'sending'} className="btn-primary w-full">
              {state === 'sending' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}{t.sendLink}
            </button>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
