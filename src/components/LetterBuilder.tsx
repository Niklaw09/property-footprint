import { useMemo, useState } from 'react';
import { Copy, Check, Mail } from 'lucide-react';
import { buildLetter, letterLabel } from '@engine/letters.ts';
import type { LetterKind } from '@engine/playbooks.ts';
import { useLang } from '@/lib/i18n';

interface Props {
  kinds: LetterKind[];
  address: string;
  siteName: string;
  urls: string[];
  ownerName?: string;
  onOwnerName?: (n: string) => void;
  emailTo?: string;
}

export default function LetterBuilder({ kinds, address, siteName, urls, ownerName = '', onOwnerName, emailTo }: Props) {
  const { t, lang } = useLang();
  const [kind, setKind] = useState<LetterKind>(kinds[0]);
  const [name, setName] = useState(ownerName);
  const [relation, setRelation] = useState<'owner' | 'tenant'>('owner');
  const [copied, setCopied] = useState(false);
  const letter = useMemo(() => buildLetter(kind, { lang, ownerName: name, address, siteName, urls, relation }), [kind, lang, name, address, siteName, urls, relation]);
  const [body, setBody] = useState<string | null>(null);
  const text = body ?? letter.body;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${letter.subject}\n\n${text}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };
  const mailto = `mailto:${emailTo ?? ''}?subject=${encodeURIComponent(letter.subject)}&body=${encodeURIComponent(text)}`;

  return (
    <div className="rounded-xl border border-navy-100 bg-cream-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-navy-900">{t.letterTitle}</h4>
        {kinds.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {kinds.map((k) => (
              <button key={k} onClick={() => { setKind(k); setBody(null); }}
                className={`rounded-full px-3 py-1 text-xs font-medium ${k === kind ? 'bg-navy-800 text-white' : 'bg-white text-navy-600 ring-1 ring-navy-100 hover:bg-navy-50'}`}>
                {letterLabel(k, lang)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-navy-500">{t.letterYourName}
          <input value={name} onChange={(e) => { setName(e.target.value); setBody(null); }} onBlur={() => onOwnerName?.(name)}
            className="mt-1 w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-sage-500 focus:outline-none" />
        </label>
        <label className="text-xs text-navy-500">{t.letterRelation}
          <select value={relation} onChange={(e) => { setRelation(e.target.value as 'owner' | 'tenant'); setBody(null); }}
            className="mt-1 w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-sage-500 focus:outline-none">
            <option value="owner">{t.relOwner}</option>
            <option value="tenant">{t.relTenant}</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs font-medium text-navy-700">{letter.subject}</p>
      <textarea value={text} onChange={(e) => setBody(e.target.value)} rows={10}
        className="mt-1 w-full rounded-lg border border-navy-200 bg-white p-3 font-mono text-xs leading-relaxed text-navy-800 focus:border-sage-500 focus:outline-none" />
      <p className="mt-1 text-xs text-navy-400">{t.letterHint}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={copy} className="btn-secondary py-2">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? t.copied : t.copy}</button>
        <a href={mailto} className="btn-secondary py-2"><Mail className="h-4 w-4" />{t.openEmail}</a>
      </div>
    </div>
  );
}
