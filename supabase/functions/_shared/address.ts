// Address parsing, normalization and matching.
// Pure TypeScript: runs in the browser, in Node (tests) and in Deno (Supabase Edge Functions).

export interface Address {
  number: string; // "14425", "2727", "12-34"
  preDir?: string; // canonical: n s e w ne nw se sw
  street: string; // canonical street-name tokens joined by space: "american kestrel", "43rd"
  suffix?: string; // canonical USPS abbreviation: "dr", "st"
  postDir?: string; // canonical: "se"
  unit?: string; // "402", "b"
  city: string; // display case
  state: string; // 2-letter upper
  zip?: string; // 5 digits
}

export const STATES: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO', connecticut: 'CT',
  delaware: 'DE', 'district of columbia': 'DC', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL',
  indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT',
  nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA',
  'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
  'puerto rico': 'PR',
};
const STATE_CODES = new Set(Object.values(STATES));

// USPS Publication 28 street suffixes (common subset): full word -> abbreviation.
export const SUFFIXES: Record<string, string> = {
  alley: 'aly', avenue: 'ave', av: 'ave', bend: 'bnd', bluff: 'blf', boulevard: 'blvd', boul: 'blvd', branch: 'br',
  bridge: 'brg', brook: 'brk', bypass: 'byp', canyon: 'cyn', cape: 'cpe', causeway: 'cswy', center: 'ctr',
  centre: 'ctr', circle: 'cir', circ: 'cir', cliff: 'clf', club: 'clb', common: 'cmn', commons: 'cmns', corner: 'cor',
  course: 'crse', court: 'ct', courts: 'cts', cove: 'cv', creek: 'crk', crescent: 'cres', crest: 'crst', crossing: 'xing',
  crossroad: 'xrd', curve: 'curv', dale: 'dl', dam: 'dm', divide: 'dv', drive: 'dr', drv: 'dr', estate: 'est',
  estates: 'ests', expressway: 'expy', extension: 'ext', falls: 'fls', ferry: 'fry', field: 'fld', fields: 'flds',
  flat: 'flt', ford: 'frd', forest: 'frst', forge: 'frg', fork: 'frk', fort: 'ft', freeway: 'fwy', garden: 'gdn',
  gardens: 'gdns', gateway: 'gtwy', glen: 'gln', green: 'grn', grove: 'grv', harbor: 'hbr', haven: 'hvn',
  heights: 'hts', highway: 'hwy', hill: 'hl', hills: 'hls', hollow: 'holw', inlet: 'inlt', island: 'is', isle: 'isle',
  junction: 'jct', key: 'ky', knoll: 'knl', lake: 'lk', lakes: 'lks', landing: 'lndg', lane: 'ln', light: 'lgt',
  loop: 'loop', mall: 'mall', manor: 'mnr', meadow: 'mdw', meadows: 'mdws', mews: 'mews', mill: 'ml', mission: 'msn',
  motorway: 'mtwy', mount: 'mt', mountain: 'mtn', orchard: 'orch', oval: 'oval', overpass: 'opas', park: 'park',
  parkway: 'pkwy', pkway: 'pkwy', pass: 'pass', passage: 'psge', path: 'path', pike: 'pike', pine: 'pne', pines: 'pnes',
  place: 'pl', plain: 'pln', plains: 'plns', plaza: 'plz', point: 'pt', pointe: 'pt', port: 'prt', prairie: 'pr',
  ranch: 'rnch', rapids: 'rpds', rest: 'rst', ridge: 'rdg', river: 'riv', road: 'rd', route: 'rte', row: 'row',
  run: 'run', shoal: 'shl', shore: 'shr', shores: 'shrs', skyway: 'skwy', spring: 'spg', springs: 'spgs', spur: 'spur',
  square: 'sq', station: 'sta', stream: 'strm', street: 'st', str: 'st', summit: 'smt', terrace: 'ter', terr: 'ter',
  trace: 'trce', track: 'trak', trafficway: 'trfy', trail: 'trl', tunnel: 'tunl', turnpike: 'tpke', union: 'un',
  valley: 'vly', viaduct: 'via', view: 'vw', views: 'vws', village: 'vlg', ville: 'vl', vista: 'vis', walk: 'walk',
  wall: 'wall', way: 'way', well: 'wl', wells: 'wls',
};
const SUFFIX_ABBRS = new Set(Object.values(SUFFIXES));
const SUFFIX_FULL: Record<string, string> = {};
for (const [full, abbr] of Object.entries(SUFFIXES)) if (!SUFFIX_FULL[abbr] && full.length > abbr.length) SUFFIX_FULL[abbr] = full;

export const DIRECTIONS: Record<string, string> = {
  north: 'n', south: 's', east: 'e', west: 'w', northeast: 'ne', northwest: 'nw', southeast: 'se', southwest: 'sw',
  n: 'n', s: 's', e: 'e', w: 'w', ne: 'ne', nw: 'nw', se: 'se', sw: 'sw',
};
const DIR_FULL: Record<string, string> = { n: 'North', s: 'South', e: 'East', w: 'West', ne: 'Northeast', nw: 'Northwest', se: 'Southeast', sw: 'Southwest' };

const ORDINAL_WORDS: Record<string, string> = {
  first: '1st', second: '2nd', third: '3rd', fourth: '4th', fifth: '5th', sixth: '6th', seventh: '7th', eighth: '8th',
  ninth: '9th', tenth: '10th', eleventh: '11th', twelfth: '12th',
};

const UNIT_WORDS = new Set(['apt', 'apartment', 'unit', 'ste', 'suite', 'bldg', 'building', 'floor', 'rm', 'room', 'lot', 'spc', 'space', 'ph', 'penthouse', 'trlr']);

/** Lowercase, strip accents and split into alphanumeric tokens. "#402" becomes "# 402". */
export function rawTokens(text: string): string[] {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/#/g, ' # ')
    .replace(/(\d)(st|nd|rd|th)\b/g, '$1$2') // keep ordinals intact
    .split(/[^a-z0-9#]+/)
    .filter(Boolean);
}

/** Canonical token: suffix and direction words become USPS abbreviations, ordinal words become numbers. */
export function canon(token: string): string {
  if (ORDINAL_WORDS[token]) return ORDINAL_WORDS[token];
  if (SUFFIXES[token]) return SUFFIXES[token];
  if (DIRECTIONS[token]) return DIRECTIONS[token];
  return token;
}

export function canonTokens(text: string): string[] {
  return rawTokens(text).map(canon);
}

function titleCase(s: string): string {
  return s.replace(/\b([a-z])([a-z]*)/g, (_, a: string, b: string) => a.toUpperCase() + b);
}

export class AddressError extends Error {
  constructor(public code: 'missing_number' | 'missing_street' | 'missing_city' | 'missing_state' | 'too_long') {
    super(code);
  }
}

/**
 * Parse a US single-line address. Handles numbered streets ("W 43rd St"), trailing directionals
 * ("Montgomery St SE"), units ("#402", "Apt 4B", "Unit 3"), with or without commas.
 */
export function parseAddress(input: string): Address {
  const cleaned = input.replace(/\s+/g, ' ').trim();
  if (cleaned.length > 200) throw new AddressError('too_long');
  // Normalize: drop trailing "USA"
  const text = cleaned.replace(/,?\s*(usa|united states( of america)?)\.?$/i, '');
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);

  let zip: string | undefined;
  let state: string | undefined;
  let city: string | undefined;
  let streetPart: string;

  // Pull "ST 12345" or "State Name 12345" from the end of the whole string.
  let tail = parts.length > 1 ? parts.slice(1).join(' ') : '';
  streetPart = parts[0];
  if (parts.length === 1) {
    // No commas: try to find state + zip at the end and a suffix boundary for the city.
    tail = '';
  }

  const extractStateZip = (s: string): string => {
    let rest = s.trim();
    const zipM = rest.match(/(\d{5})(-\d{4})?\s*$/);
    if (zipM) {
      zip = zipM[1];
      rest = rest.slice(0, zipM.index).trim();
    }
    const words = rest.split(' ');
    // Try two-word, then one-word state names / codes at the end.
    for (const n of [3, 2, 1]) {
      if (words.length < n) continue;
      const cand = words.slice(-n).join(' ').toLowerCase().replace(/\./g, '');
      if (STATES[cand]) { state = STATES[cand]; return words.slice(0, -n).join(' ').trim(); }
      if (n === 1 && STATE_CODES.has(cand.toUpperCase()) && cand.length === 2) { state = cand.toUpperCase(); return words.slice(0, -n).join(' ').trim(); }
    }
    return rest;
  };

  if (parts.length >= 2) {
    // "street, city, ST zip" or "street, city ST zip" or "street, unit, city, ST zip"
    const last = extractStateZip(parts[parts.length - 1]);
    let middle = parts.slice(1, -1);
    if (last) middle = [...middle, last];
    // If a middle part looks like a unit ("Apt 4", "#402", "Unit B"), merge it into the street part.
    const unitLike = /^(#|apt|apartment|unit|ste|suite|bldg|lot|fl|floor|rm|ph)\b/i;
    const nonUnit = middle.filter((m) => {
      if (unitLike.test(m)) { streetPart = `${streetPart} ${m}`; return false; }
      return true;
    });
    city = nonUnit.join(' ').trim() || undefined;
  } else {
    // No commas: "123 Main St Springfield IL 62704"
    const rest = extractStateZip(streetPart);
    const words = rest.split(' ');
    // Find the last suffix/direction/unit boundary; everything after is the city.
    let boundary = -1;
    for (let i = 1; i < words.length - 1; i++) {
      const t = words[i].toLowerCase().replace(/\./g, '');
      if (SUFFIXES[t] || SUFFIX_ABBRS.has(t)) boundary = i;
    }
    if (boundary > 0) {
      let j = boundary + 1;
      // trailing directional and unit belong to the street
      if (words[j] && DIRECTIONS[words[j].toLowerCase()]) j++;
      if (words[j] && (UNIT_WORDS.has(words[j].toLowerCase().replace(/\./g, '')) || words[j].startsWith('#'))) {
        j += words[j].startsWith('#') && words[j].length > 1 ? 1 : 2;
      }
      streetPart = words.slice(0, j).join(' ');
      city = words.slice(j).join(' ') || undefined;
    } else {
      streetPart = rest;
    }
  }

  // Street line
  const st = streetPart.replace(/\./g, '').replace(/#\s*/g, '# ').split(' ').filter(Boolean);
  const numM = st[0]?.match(/^(\d+[a-z]?(?:-\d+[a-z]?)?)$/i);
  if (!numM) throw new AddressError('missing_number');
  const number = numM[1].toLowerCase();
  let toks = st.slice(1);

  // Unit: "#402", "Apt 4B", "Unit 3", "Ste 100"
  let unit: string | undefined;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i].toLowerCase();
    if (t === '#' || UNIT_WORDS.has(t)) {
      const u = toks[i + 1];
      if (u) {
        unit = u.replace(/^#/, '').toLowerCase();
        toks = toks.slice(0, i);
        break;
      }
    }
    if (/^#\w+$/.test(t)) { unit = t.slice(1); toks = toks.slice(0, i); break; }
  }

  let lower = toks.map((t) => t.toLowerCase());
  let preDir: string | undefined;
  let postDir: string | undefined;
  let suffix: string | undefined;
  if (lower.length > 1 && DIRECTIONS[lower[0]]) { preDir = DIRECTIONS[lower[0]]; lower = lower.slice(1); }
  if (lower.length > 1 && DIRECTIONS[lower[lower.length - 1]]) { postDir = DIRECTIONS[lower[lower.length - 1]]; lower = lower.slice(0, -1); }
  if (lower.length > 1) {
    const last = lower[lower.length - 1];
    if (SUFFIXES[last]) suffix = SUFFIXES[last];
    else if (SUFFIX_ABBRS.has(last)) suffix = last;
    if (suffix) lower = lower.slice(0, -1);
  }
  if (lower.length === 0) throw new AddressError('missing_street');
  const street = lower.map((t) => ORDINAL_WORDS[t] ?? t).join(' ');

  if (!city) throw new AddressError('missing_city');
  if (!state) throw new AddressError('missing_state');

  return { number, preDir, street, suffix, postDir, unit, city: titleCase(city.toLowerCase()), state, zip };
}

/** "14425 American Kestrel Dr" (USPS style, abbreviated). */
export function streetLine(a: Address, opts: { full?: boolean; unit?: boolean } = {}): string {
  const dir = (d?: string) => (d ? (opts.full ? DIR_FULL[d] : d.toUpperCase()) : undefined);
  const suf = a.suffix ? (opts.full ? titleCase(SUFFIX_FULL[a.suffix] ?? a.suffix) : titleCase(a.suffix)) : undefined;
  const bits = [a.number.toUpperCase(), dir(a.preDir), titleCase(a.street), suf, dir(a.postDir)].filter(Boolean);
  let line = bits.join(' ');
  if (opts.unit !== false && a.unit) line += ` #${a.unit.toUpperCase()}`;
  return line;
}

export function displayAddress(a: Address): string {
  return `${streetLine(a)}, ${a.city}, ${a.state}${a.zip ? ` ${a.zip}` : ''}`;
}

/** Stable key used to dedupe reports for the same property. */
export function addressKey(a: Address): string {
  return [a.number, a.preDir ?? '', a.street, a.suffix ?? '', a.postDir ?? '', a.unit ?? '', a.state, a.zip ?? a.city.toLowerCase()]
    .join('|')
    .toLowerCase();
}

/** Quoted phrases for search queries: abbreviated and spelled-out street lines (without unit). */
export function streetPhrases(a: Address): string[] {
  const out = new Set<string>();
  out.add(streetLine(a, { unit: false }));
  out.add(streetLine(a, { full: true, unit: false }));
  // Many listing sites drop a trailing directional ("89 Montgomery St" instead of "89 Montgomery St SE").
  if (a.postDir) out.add(streetLine({ ...a, postDir: undefined }, { unit: false }));
  return [...out];
}

// ─── Matching ──────────────────────────────────────────────────────────────

export type MatchLevel = 'exact' | 'likely' | 'none';

export interface MatchResult {
  level: MatchLevel;
  reasons: string[]; // machine codes, e.g. "street", "zip", "city", "unit", "suffix_conflict"
}

function findSeq(hay: string[], needle: string[], from = 0): number {
  outer: for (let i = from; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

/**
 * Decide whether a piece of text (URL slug + title + snippet) refers to this exact property.
 * Deterministic: requires the house number immediately followed by the street name,
 * no conflicting suffix/unit/zip, and a city or ZIP match somewhere in the text.
 */
export function matchAddress(a: Address, text: string): MatchResult {
  const toks = canonTokens(text);
  const streetToks = a.street.split(' ').map(canon);
  const numberToks = rawTokens(a.number); // "12-34" -> ["12","34"]
  const reasons: string[] = [];
  let best: MatchResult = { level: 'none', reasons: [] };

  for (let i = findSeq(toks, numberToks); i !== -1; i = findSeq(toks, numberToks, i + 1)) {
    let k = i + numberToks.length;
    const r: string[] = [];
    if (DIRECTIONS[toks[k]] && toks[k].length <= 2 && streetToks[0] !== toks[k]) {
      if (a.preDir && toks[k] !== a.preDir) continue; // "N Main" vs "S Main"
      k++;
    }
    if (findSeq(toks, streetToks, k) !== k) continue;
    k += streetToks.length;
    r.push('street');
    // Suffix
    const next = toks[k];
    if (next && SUFFIX_ABBRS.has(next) && next !== 'park' && next !== 'way') {
      if (a.suffix && next !== a.suffix) continue; // "Main St" vs "Main Ave": different street
      if (a.suffix) r.push('suffix');
      k++;
    }
    // Post-directional
    if (toks[k] && DIRECTIONS[toks[k]] && toks[k].length <= 2) {
      if (a.postDir && toks[k] !== a.postDir) continue;
      k++;
    }
    // Unit check: look at the next few tokens for "# 402", "unit 402", "apt 402" or a bare "402" right after
    let textUnit: string | undefined;
    for (let j = k; j < Math.min(k + 3, toks.length); j++) {
      if (toks[j] === '#' || UNIT_WORDS.has(toks[j])) { textUnit = toks[j + 1]; break; }
    }
    if (a.unit) {
      if (textUnit && textUnit !== a.unit) continue; // different unit in the same building
      if (textUnit === a.unit) r.push('unit');
      else if (toks.includes(a.unit)) r.push('unit_loose');
      else r.push('unit_missing');
    } else if (textUnit && /^\d{1,4}[a-z]?$/.test(textUnit)) {
      r.push('other_unit');
    }
    // Locality: ZIP or city tokens anywhere
    const zips = toks.filter((t) => /^\d{5}$/.test(t));
    if (a.zip && zips.includes(a.zip)) r.push('zip');
    else if (a.zip && zips.length > 0 && zips.every((z) => z !== a.zip) && !hasCity(toks, a.city)) continue; // a different ZIP and no city: different property
    if (hasCity(toks, a.city)) r.push('city');
    if (toks.includes(a.state.toLowerCase())) r.push('state');

    const level = scoreLevel(a, r);
    if (rank(level) > rank(best.level) || (level === best.level && r.length > best.reasons.length)) best = { level, reasons: r };
  }
  if (best.level === 'none' && reasons.length) best.reasons = reasons;
  return best;
}

function hasCity(toks: string[], city: string): boolean {
  const c = canonTokens(city);
  return c.length > 0 && findSeq(toks, c) !== -1;
}

function scoreLevel(a: Address, r: string[]): MatchLevel {
  const locality = r.includes('zip') || r.includes('city');
  if (r.includes('other_unit')) return 'likely'; // a unit in the building, user has no unit: needs a look
  if (a.unit && r.includes('unit_missing')) return locality ? 'likely' : 'none';
  if (locality) return 'exact';
  if (r.includes('state') || r.includes('suffix')) return 'likely';
  return 'none';
}

function rank(l: MatchLevel): number {
  return l === 'exact' ? 2 : l === 'likely' ? 1 : 0;
}

/** Decode a URL into matchable text: path segments, with hyphens/underscores as spaces. */
export function urlText(url: string): string {
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname).replace(/[-_/+.]/g, ' ');
  } catch {
    return '';
  }
}
