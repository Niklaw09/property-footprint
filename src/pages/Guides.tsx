import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { PLAYBOOKS, playbookName, type Playbook, type PlaybookGroup } from '@engine/playbooks.ts';
import { StatusBadge } from '@/components/PlaybookView';
import { useLang } from '@/lib/i18n';
import { GUIDE_STRINGS } from '@/i18n/guides';
import { href } from '@/lib/router';

const GROUPS: PlaybookGroup[] = ['source', 'portal', 'brokerage', 'social', 'tour', 'rental', 'search'];
// Within a group, the sites people hit most come first.
const ORDER = ['mls', 'zillow', 'redfin', 'realtor', 'homes', 'trulia', 'movoto', 'estately', 'har', 'kw', 'remax', 'exp', 'anywhere', 'compass', 'bhhs', 'howardhanna', 'real', 'brokerage', 'idx_platform',
  'youtube', 'facebook', 'instagram', 'tiktok', 'pinterest', 'vimeo', 'matterport', 'property_site', 'tour_host', 'google', 'streetview', 'bing'];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function Guides() {
  const { t, lang } = useLang();
  const g = GUIDE_STRINGS[lang];
  const [q, setQ] = useState('');
  const keys = [...ORDER.filter((k) => PLAYBOOKS[k]), ...Object.keys(PLAYBOOKS).filter((k) => !ORDER.includes(k))];
  const match = useMemo(() => {
    const needle = norm(q.trim());
    if (!needle) return () => true;
    return (pb: Playbook) => norm([pb.name, pb.nameEs ?? '', ...(pb.covers ?? [])].join(' ')).includes(needle);
  }, [q]);
  const groups = GROUPS.map((grp) => ({ grp, items: keys.map((k) => PLAYBOOKS[k]).filter((pb) => pb.group === grp && match(pb)) })).filter((x) => x.items.length);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-3xl font-semibold text-navy-900">{t.guidesTitle}</h1>
      <p className="mt-2 max-w-2xl text-navy-500">{t.guidesBody}</p>
      <label className="relative mt-6 block max-w-md">
        <span className="sr-only">{g.guidesSearch}</span>
        <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={g.guidesSearch} className="input-field py-3 pl-10 text-sm" />
      </label>
      {groups.length === 0 && <p className="mt-6 text-sm text-navy-500">{g.guidesNone}</p>}
      {groups.map(({ grp, items }) => (
        <section key={grp} className="mt-10">
          <h2 className="section-title">{g.groups[grp]}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((pb) => (
              <a key={pb.key} href={href({ name: 'guide', key: pb.key })} className="card group flex flex-col transition hover:border-sage-300">
                <p className="font-semibold text-navy-900">{playbookName(pb, lang)}</p>
                {pb.covers?.length ? <p className="mt-0.5 line-clamp-1 text-xs text-navy-400">{g.alsoCovers}: {pb.covers.join(', ')}</p> : null}
                <p className="mt-1 line-clamp-3 text-sm text-navy-500">{pb.outcome[lang]}</p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <StatusBadge pb={pb} />
                  <ArrowRight className="h-4 w-4 text-navy-300 group-hover:text-sage-600" />
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
