import { ShieldCheck } from 'lucide-react';
import BrandMark from './BrandMark';
import { useLang } from '@/lib/i18n';
import { href } from '@/lib/router';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-navy-950 text-navy-300">
      <div className="safe-x mx-auto grid max-w-6xl gap-8 py-10 sm:px-6 md:grid-cols-[1fr_1.4fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-base font-bold text-white">{t.brand}</span>
              <span className="mt-1 text-[11px] text-navy-400">{t.byCompany}</span>
            </span>
          </div>
          <p className="mt-4"><a className="text-sm font-medium text-sage-300 underline decoration-sage-300/40 underline-offset-2 hover:text-sage-200" href={href({ name: 'guides' })}>{t.navGuides}</a></p>
        </div>
        <div className="space-y-2 text-xs leading-relaxed text-navy-400">
          <p className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-400" />{t.footerNote}</p>
          <p className="pl-[22px]">{t.privacy}</p>
          <p className="pl-[22px]">{t.operator}</p>
        </div>
      </div>
    </footer>
  );
}
