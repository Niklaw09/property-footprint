import type { Lang } from '../i18n/strings';

// Site names come from the scan engine in English. Brand names stay as they are;
// only the generic words ("Agent website", "property website") are translated.
const ES: [RegExp, string][] = [
  [/^Agent website \((.+)\)$/, 'Sitio web de agente ($1)'],
  [/^(.+) property website$/, 'Sitio web de la propiedad ($1)'],
  [/^Property website$/, 'Sitio web de la propiedad'],
];

export function siteLabel(name: string, lang: Lang): string {
  if (lang !== 'es') return name;
  for (const [re, out] of ES) if (re.test(name)) return name.replace(re, out);
  return name;
}
