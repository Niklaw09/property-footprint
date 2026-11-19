import { ArrowLeft } from 'lucide-react';
import { PLAYBOOKS, playbookName } from '@engine/playbooks.ts';
import PlaybookView from '@/components/PlaybookView';
import { useLang } from '@/lib/i18n';
import { href } from '@/lib/router';

export default function Guide({ pbKey }: { pbKey: string }) {
  const { t, lang } = useLang();
  const pb = PLAYBOOKS[pbKey];
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <a href={href({ name: 'guides' })} className="link inline-flex items-center gap-1 text-sm"><ArrowLeft className="h-4 w-4" />{t.guidesBack}</a>
      {pb ? (
        <>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-navy-900">{playbookName(pb, lang)}</h1>
          <div className="mt-6"><PlaybookView pb={pb} address={t.addressPlaceholder} /></div>
        </>
      ) : <p className="mt-8 text-navy-500">{t.errNotFound}</p>}
    </div>
  );
}
