import { useState } from 'react';
import { ChevronDown, ChevronRight, MousePointerClick, Smartphone, Monitor } from 'lucide-react';
import type { L, MoreInfo, UiTrail } from '@engine/playbooks.ts';
import { useLang } from '@/lib/i18n';
import { GUIDE_STRINGS } from '@/i18n/guides';

/** The removal route at a glance: numbered stops joined by arrows. Wraps to a vertical list on phones. */
export function FlowDiagram({ flow }: { flow: L[] }) {
  const { lang } = useLang();
  const g = GUIDE_STRINGS[lang];
  if (!flow.length) return null;
  return (
    <figure className="rounded-xl border border-navy-100 bg-cream-50 p-3">
      <figcaption className="eyebrow">{g.routeTitle}</figcaption>
      <ol className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
        {flow.map((stop, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${i === flow.length - 1 ? 'border-sage-300 bg-sage-50 text-sage-800' : 'border-navy-100 bg-white text-navy-700'}`}>
              <span className="num flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-navy-800 text-[10px] text-white">{i + 1}</span>
              {stop[lang]}
            </span>
            {i < flow.length - 1 && <ChevronRight aria-hidden className="hidden h-4 w-4 shrink-0 text-navy-300 sm:block" />}
          </li>
        ))}
      </ol>
    </figure>
  );
}

/**
 * A drawn "what to click" illustration: a simple browser or phone frame with the exact labels to look for,
 * the last one highlighted with a pointer. Generic shapes only, no site screenshots or logos.
 */
export function StepVisual({ ui }: { ui: UiTrail }) {
  const { lang } = useLang();
  const g = GUIDE_STRINGS[lang];
  const web = ui.surface === 'web';
  const Icon = web ? Monitor : Smartphone;
  return (
    <figure className={`mt-2 overflow-hidden rounded-xl border border-navy-100 bg-white ${web ? 'max-w-md' : 'max-w-[15rem]'}`} aria-label={`${g.whatToClick}: ${ui.trail.join(' → ')}`}>
      <div className="flex items-center gap-2 border-b border-navy-100 bg-cream-50 px-3 py-1.5">
        {web ? (
          <span aria-hidden className="flex gap-1"><span className="h-2 w-2 rounded-full bg-navy-200" /><span className="h-2 w-2 rounded-full bg-navy-200" /><span className="h-2 w-2 rounded-full bg-navy-200" /></span>
        ) : <span aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-navy-200" />}
        {web && ui.site && <span className="num truncate rounded-md bg-white px-2 py-0.5 text-[11px] text-navy-500 ring-1 ring-navy-100">{ui.site}</span>}
      </div>
      <div className="space-y-1.5 p-3">
        <p className="flex items-center gap-1 text-[11px] font-medium text-navy-400"><Icon className="h-3 w-3" />{g.whatToClick} · {web ? g.onComputer : g.inApp}</p>
        <ol className="flex flex-wrap items-center gap-1.5">
          {ui.trail.map((label, i) => {
            const last = i === ui.trail.length - 1;
            return (
              <li key={i} className="flex items-center gap-1.5">
                <span className={`relative inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${last ? 'bg-sage-600 text-white shadow-sm' : 'border border-navy-200 bg-white text-navy-700'}`}>
                  {label}
                  {last && <MousePointerClick aria-hidden className="absolute -bottom-3 -right-3 h-4 w-4 text-navy-800" />}
                </span>
                {!last && <ChevronRight aria-hidden className="h-3.5 w-3.5 text-navy-300" />}
              </li>
            );
          })}
        </ol>
      </div>
      <figcaption className="border-t border-navy-50 bg-cream-50 px-3 py-1 text-[10px] leading-snug text-navy-400">{g.illustrationNote}</figcaption>
    </figure>
  );
}

/** A small "More info" toggle under a step. */
export function MoreToggle({ text }: { text: string }) {
  const { lang } = useLang();
  const g = GUIDE_STRINGS[lang];
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1.5">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-md px-1 text-xs font-semibold text-sage-700 hover:text-sage-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400">
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />{open ? g.lessInfo : g.moreInfo}
      </button>
      {open && <p className="mt-1 rounded-lg bg-cream-50 p-2.5 text-sm leading-relaxed text-navy-600">{text}</p>}
    </div>
  );
}

/** Guide-level questions, each one expandable. */
export function MoreInfoList({ items }: { items: MoreInfo[] }) {
  const { lang } = useLang();
  const g = GUIDE_STRINGS[lang];
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">{g.questions}</p>
      <div className="mt-2 divide-y divide-navy-100 rounded-xl border border-navy-100 bg-white">
        {items.map((m, i) => (
          <details key={i} className="group px-3 py-2.5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-medium text-navy-800 [&::-webkit-details-marker]:hidden">
              {m.q[lang]}
              <ChevronDown aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-navy-400 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-navy-600">{m.a[lang]}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
