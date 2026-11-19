import { ExternalLink, Clock, BadgeCheck, Info, Phone, Mail, Globe } from 'lucide-react';
import { playbookName, type Playbook } from '@engine/playbooks.ts';
import { useLang } from '@/lib/i18n';
import LetterBuilder from './LetterBuilder';
import { FlowDiagram, MoreInfoList, MoreToggle, StepVisual } from './GuideVisuals';
import { GUIDE_STRINGS } from '@/i18n/guides';

interface Props {
  pb: Playbook;
  address?: string;
  siteName?: string;
  urls?: string[];
  ownerName?: string;
  onOwnerName?: (n: string) => void;
}

export function StatusBadge({ pb }: { pb: Playbook }) {
  const { t, lang } = useLang();
  const checked = /^\d{4}-\d{2}-\d{2}$/.test(pb.checkedOn) ? new Date(`${pb.checkedOn}T12:00:00`).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : pb.checkedOn;
  const label = pb.status === 'verified' ? t.pbVerified : pb.status === 'researched' ? t.pbResearched : t.pbGeneral;
  const color = pb.status === 'verified' ? 'bg-sage-100 text-sage-800' : pb.status === 'researched' ? 'bg-navy-50 text-navy-700' : 'bg-cream-200 text-navy-600';
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${color}`}><BadgeCheck className="h-3 w-3" />{label} · {checked}</span>;
}

export default function PlaybookView({ pb, address, siteName, urls, ownerName, onOwnerName }: Props) {
  const { t, lang } = useLang();
  const g = GUIDE_STRINGS[lang];
  const email = pb.contacts?.find((c) => c.kind === 'email')?.value;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-navy-500">
        <StatusBadge pb={pb} />
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />~{pb.minutes} {t.pbMinutes}</span>
        <span>{t.pbDifficulty[pb.difficulty]}</span>
      </div>
      <div className="rounded-lg border-l-4 border-sage-400 bg-sage-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-sage-800">{t.pbOutcome}</p>
        <p className="mt-1 text-sm leading-relaxed text-navy-800">{pb.outcome[lang]}</p>
        {pb.covers?.length ? <p className="mt-2 text-xs text-navy-500"><span className="font-semibold">{g.alsoCovers}:</span> {pb.covers.join(', ')}</p> : null}
      </div>
      <FlowDiagram flow={pb.flow} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">{t.pbSteps}</p>
        <ol className="mt-2 space-y-3">
          {pb.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-800 text-xs font-semibold text-white">{i + 1}</span>
              <div className="min-w-0 flex-1 text-sm leading-relaxed text-navy-800">
                <p>{s[lang]}</p>
                {s.ui && <StepVisual ui={s.ui} />}
                {s.link && (
                  <a href={s.link.url} target="_blank" rel="noopener noreferrer" className="link mt-1.5 inline-flex items-center gap-1 text-sm">
                    {s.link[lang]}<ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {s.more && <MoreToggle text={s.more[lang]} />}
              </div>
            </li>
          ))}
        </ol>
      </div>
      {pb.contacts?.length ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">{t.pbContacts}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {pb.contacts.map((c) => (
              <li key={c.value} className="flex items-center gap-2 text-navy-700">
                {c.kind === 'email' ? <Mail className="h-4 w-4 text-navy-400" /> : c.kind === 'phone' ? <Phone className="h-4 w-4 text-navy-400" /> : <Globe className="h-4 w-4 text-navy-400" />}
                <span>{c.label[lang]}:</span>
                <a className="link" href={c.kind === 'email' ? `mailto:${c.value}` : c.kind === 'phone' ? `tel:${c.value.replace(/[^\d+]/g, '')}` : c.value}>{c.value}</a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {pb.letters.length > 0 && address && (
        <LetterBuilder kinds={pb.letters} address={address} siteName={siteName ?? playbookName(pb, lang)} urls={urls ?? []} ownerName={ownerName} onOwnerName={onOwnerName} emailTo={email} />
      )}
      {pb.tips?.length ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">{t.pbTips}</p>
          <ul className="mt-2 space-y-2">
            {pb.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-navy-600"><Info className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />{tip[lang]}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {pb.more?.length ? <MoreInfoList items={pb.more} /> : null}
      {pb.sources.length > 0 && (
        <details className="text-xs text-navy-400">
          <summary className="cursor-pointer">{t.pbSources}</summary>
          <ul className="mt-1 space-y-0.5">{pb.sources.map((s) => <li key={s}><a className="hover:underline" href={s} target="_blank" rel="noopener noreferrer">{s}</a></li>)}</ul>
        </details>
      )}
    </div>
  );
}
