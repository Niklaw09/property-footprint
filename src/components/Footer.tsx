import { ShieldCheck } from 'lucide-react';
import BrandMark from './BrandMark';
import { useLang } from '@/lib/i18n';
import { href } from '@/lib/router';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-navy-100 bg-cream-50 text-navy-500">
      <div className="safe-x mx-auto grid max-w-6xl gap-8 py-10 sm:px-6 md:grid-cols-[1fr_1.4fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="flex flex-col leading-none">
              <span className="font-serif text-base font-semibold text-navy-800">{t.brand}</span>
              <span className="mt-1 text-[11px] text-navy-400">{t.byCompany}</span>
            </span>
          </div>
          <p className="mt-4"><a className="link text-sm" href={href({ name: 'guides' })}>{t.navGuides}</a></p>
        </div>
        <div className="space-y-2 text-xs leading-relaxed text-navy-400">
          <p className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-600" />{t.footerNote}</p>
          <p className="pl-[22px]">{t.privacy}</p>
          <p className="pl-[22px]">{t.operator}</p>
          <p className="pl-[22px]"><a className="link" href="/privacy.html">{t.privacyLink}</a> · <a className="link" href="/terms.html">{t.termsLink}</a></p>
        </div>
      </div>
    </footer>
  );
}
