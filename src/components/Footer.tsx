import BrandMark from './BrandMark';
import { useLang } from '@/lib/i18n';
import { href } from '@/lib/router';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-navy-100 bg-cream-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-7 w-7" />
          <span className="font-serif text-sm font-semibold text-navy-800">{t.brand}</span>
        </div>
        <div className="max-w-md space-y-1 text-xs leading-relaxed text-navy-400 sm:text-right">
          <p>{t.footerNote}</p>
          <p>{t.privacy}</p>
          <p><a className="link" href={href({ name: 'guides' })}>{t.navGuides}</a></p>
        </div>
      </div>
    </footer>
  );
}
