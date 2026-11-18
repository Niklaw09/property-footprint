import { BookOpen, Home, LogIn, LogOut } from 'lucide-react';
import BrandMark from './BrandMark';
import { useLang } from '@/lib/i18n';
import { href } from '@/lib/router';
import type { AppCtx } from '@/App';

export default function Header({ ctx }: { ctx: AppCtx }) {
  const { t, lang, setLang } = useLang();
  const navBtn = 'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-navy-700 transition-colors hover:bg-navy-50 sm:px-3 sm:text-sm';
  return (
    <header className="border-b border-navy-100 bg-cream-50/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-4">
        <a href={href({ name: 'home' })} className="flex shrink-0 items-center gap-2 rounded-md">
          <BrandMark className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="hidden whitespace-nowrap font-serif text-base font-semibold text-navy-800 sm:inline sm:text-lg">{t.brand}</span>
        </a>
        <nav className="flex items-center gap-0.5 sm:gap-2">
          <a href={href({ name: 'guides' })} className={navBtn}><BookOpen className="h-4 w-4" /><span className="hidden sm:inline">{t.navGuides}</span></a>
          {ctx.user ? (
            <>
              <a href={href({ name: 'homes' })} className={navBtn}><Home className="h-4 w-4" />{t.navMyHomes}</a>
              <button onClick={() => ctx.api.signOut()} className={navBtn} aria-label={t.navSignOut}><LogOut className="h-4 w-4" /></button>
            </>
          ) : (
            <a href={href({ name: 'signin', next: window.location.hash || '#/' })} className={navBtn}><LogIn className="h-4 w-4" />{t.navSignIn}</a>
          )}
          <div className="ml-1 flex items-center rounded-full border border-navy-200 bg-white p-0.5" role="group" aria-label={t.langAria}>
            {(['en', 'es'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
                className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors sm:px-3 sm:py-1 ${lang === l ? 'bg-navy-800 text-white' : 'text-navy-500 hover:text-navy-800'}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
