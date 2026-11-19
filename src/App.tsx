import { useEffect, useState } from 'react';
import { getApi, type Api } from '@/lib/api';
import { go, parseRoute, useRoute } from '@/lib/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Landing from '@/pages/Landing';
import Report from '@/pages/Report';
import Guides from '@/pages/Guides';
import Guide from '@/pages/Guide';
import SignIn from '@/pages/SignIn';
import MyHomes from '@/pages/MyHomes';
import Selftest from '@/pages/Selftest';
import { useLang } from '@/lib/i18n';

export interface AppCtx {
  api: Api;
  user: { email: string } | null;
}

export default function App() {
  const route = useRoute();
  const { t } = useLang();
  const [api, setApi] = useState<Api | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let off = () => {};
    getApi().then(async (a) => {
      setUser(await a.session().catch(() => null));
      off = a.onAuth((u) => setUser(u));
      const qs0 = new URLSearchParams(window.location.search);
      if (qs0.get('paid')) setConfirming(true);
      setApi(a);
      // Returning from a sign-in link: ?next=#/r/<id>&code=...  -> go to the page they came from.
      const qs = new URLSearchParams(window.location.search);
      const next = qs.get('next');
      // Returning from Stripe Checkout: ?paid=cs_...&next=#/r/<id>. The webhook also grants access; this makes it instant.
      const paid = qs.get('paid');
      if (paid && /^cs_[A-Za-z0-9_]+$/.test(paid)) {
        try { await a.confirm(paid); } catch { /* the webhook will still apply it */ }
      }
      setConfirming(false);
      if (next || paid) {
        const target = next || window.location.hash || '#/';
        window.history.replaceState(null, '', window.location.pathname + target);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
        if (next && parseRoute(next).name === 'home') go({ name: 'homes' });
      }
    });
    return () => off();
  }, []);

  if (!api) return <div className="min-h-screen bg-cream-100" />;
  const ctx: AppCtx = { api, user };

  return (
    <div className="flex min-h-screen flex-col">
      <Header ctx={ctx} />
      {api.mode === 'demo' && (
        <div className="border-b border-sage-200 bg-sage-50 px-4 py-2 text-center text-xs text-sage-800">{t.demoBanner}</div>
      )}
      <main className="flex-1">
        {confirming && <p role="status" className="py-24 text-center text-navy-600">{t.paymentConfirming}</p>}
        {!confirming && route.name === 'home' && <Landing ctx={ctx} />}
        {route.name === 'report' && <Report ctx={ctx} id={route.id} />}
        {route.name === 'guides' && <Guides />}
        {route.name === 'guide' && <Guide pbKey={route.key} />}
        {route.name === 'signin' && <SignIn ctx={ctx} next={route.next} />}
        {route.name === 'homes' && <MyHomes ctx={ctx} />}
        {route.name === 'selftest' && <Selftest ctx={ctx} />}
      </main>
      <Footer />
    </div>
  );
}
