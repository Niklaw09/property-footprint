import { ArrowRight } from 'lucide-react';
import { PLAYBOOKS } from '@engine/playbooks.ts';
import { StatusBadge } from '@/components/PlaybookView';
import { useLang } from '@/lib/i18n';
import { href } from '@/lib/router';

const ORDER = ['mls', 'zillow', 'redfin', 'realtor', 'trulia', 'homes', 'matterport', 'property_site', 'youtube', 'google', 'bing', 'streetview'];

export default function Guides() {
  const { t, lang } = useLang();
  const keys = [...ORDER, ...Object.keys(PLAYBOOKS).filter((k) => !ORDER.includes(k))];
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-3xl font-semibold text-navy-900">{t.guidesTitle}</h1>
      <p className="mt-2 max-w-2xl text-navy-500">{t.guidesBody}</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {keys.map((k) => {
          const pb = PLAYBOOKS[k];
          return (
            <a key={k} href={href({ name: 'guide', key: k })} className="card group flex flex-col transition hover:border-sage-300">
              <p className="font-semibold text-navy-900">{pb.name}</p>
              <p className="mt-1 line-clamp-3 text-sm text-navy-500">{pb.outcome[lang]}</p>
              <div className="mt-auto flex items-center justify-between pt-3">
                <StatusBadge pb={pb} />
                <ArrowRight className="h-4 w-4 text-navy-300 group-hover:text-sage-600" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
