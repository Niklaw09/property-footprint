import { useEffect, useRef } from 'react';

// Cloudflare Turnstile in "interaction-only" mode: invisible for most visitors, a one-click check for suspicious traffic.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
export const captchaEnabled = !!SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render(el: HTMLElement, opts: Record<string, unknown>): string;
      reset(id: string): void;
      remove(id: string): void;
    };
  }
}

let loader: Promise<void> | null = null;
function load(): Promise<void> {
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('turnstile_load'));
      document.head.appendChild(s);
    });
  }
  return loader;
}

export interface TurnstileHandle { reset(): void }

export default function Turnstile({ onToken, lang, handle }: { onToken: (t: string | null) => void; lang: string; handle?: React.MutableRefObject<TurnstileHandle | null> }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!SITE_KEY) return;
    let id: string | null = null;
    let cancelled = false;
    load().then(() => {
      if (cancelled || !el.current || !window.turnstile) return;
      id = window.turnstile.render(el.current, {
        sitekey: SITE_KEY,
        appearance: 'interaction-only',
        language: lang,
        callback: (t: string) => onToken(t),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
      if (handle) handle.current = { reset: () => { onToken(null); if (id) window.turnstile?.reset(id); } };
    }).catch(() => onToken(null));
    return () => { cancelled = true; if (id) window.turnstile?.remove(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);
  if (!SITE_KEY) return null;
  return <div ref={el} className="mt-2 flex justify-center sm:justify-start" />;
}
