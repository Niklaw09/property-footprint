import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { STRINGS, type Lang, type Strings } from '@/i18n/strings';

interface Ctx { lang: Lang; t: Strings; setLang: (l: Lang) => void }
const LangCtx = createContext<Ctx>({ lang: 'en', t: STRINGS.en, setLang: () => {} });

function initial(): Lang {
  try {
    const saved = localStorage.getItem('pf.lang');
    if (saved === 'en' || saved === 'es') return saved;
  } catch { /* storage blocked */ }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('pf.lang', l); } catch { /* ignore */ }
  };
  return <LangCtx.Provider value={{ lang, t: STRINGS[lang], setLang }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
