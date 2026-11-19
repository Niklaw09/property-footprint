import { BookOpen, Home, LogIn, LogOut } from 'lucide-react';
import BrandMark from './BrandMark';
import { useLang } from '@/lib/i18n';
import { href } from '@/lib/router';
import type { AppCtx } from '@/App';

export default function Header({ ctx }: { ctx: AppCtx }) {
  const { t, lang, setLang } = useLang();
  const navBtn = 'inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-50 hover:text-navy-900 sm:px-3';
  return (
    <header className="sticky top-0 z-40 border-b border-navy-100/80 bg-cream-100/80 backdrop-blur-md supports-[backdrop-filter]:bg-cream-100/70">
      <div className="safe-x mx-auto flex max-w-6xl items-center justify-between gap-2 py-2.5 sm:px-6 sm:py-3">
        <a href={href({ name: 'home' })} className="flex shrink-0 items-center gap-2.5 rounded-lg">
          <BrandMark className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[17px] font-bold tracking-tight text-navy-900">{t.brand}</span>
            <span className="mt-1 hidden text-[11px] font-medium text-navy-400 sm:block">{t.byCompany}</span>
          </span>
        </a>
        <nav className="flex items-center gap-0.5 sm:gap-1">
          <a href={href({ name: 'guides' })} className={navBtn} aria-label={t.navGuides}><BookOpen className="h-4 w-4" /><span className="hidden md:inline">{t.navGuides}</span></a>
          {ctx.user ? (
            <>
              <a href={href({ name: 'homes' })} className={navBtn}><Home className="h-4 w-4" /><span className="hidden sm:inline">{t.navMyHomes}</span></a>
              <button onClick={() => ctx.api.signOut()} className={navBtn} aria-label={t.navSignOut}><LogOut className="h-4 w-4" /></button>
            </>
          ) : (
            <a href={href({ name: 'signin', next: window.location.hash || '#/' })} className={navBtn}><LogIn className="h-4 w-4" /><span className="whitespace-nowrap">{t.navSignIn}</span></a>
          )}
          <div className="ml-1 flex items-center rounded-lg border border-navy-200 bg-white p-0.5 shadow-sm" role="group" aria-label={t.langAria}>
            {(['en', 'es'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
                className={`min-h-[30px] rounded-md px-2 font-mono text-[11px] font-semibold transition-colors sm:px-2.5 ${lang === l ? 'bg-navy-900 text-white' : 'text-navy-500 hover:text-navy-900'}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
