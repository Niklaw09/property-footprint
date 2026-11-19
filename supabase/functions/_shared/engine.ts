// The finding engine: portal lookups + web/image/video search -> deterministic address matching -> findings.

import { type Address, DIRECTIONS, canon, canonTokens, rawTokens, SUFFIXES, matchAddress, streetLine, streetPhrases, urlText, displayAddress, type MatchLevel } from './address.ts';
import { type PhotoStatus, canFetch, checkPage } from './photos.ts';
import { type Candidate, type FetchLike, type PortalLookup, type SearchProvider, type SearchQuery, PORTAL_LOOKUPS, ProviderError } from './providers.ts';
import { SITES, SEARCH_GROUPS, NAMED_FILL_DOMAINS, type MediaType, type Site, type SiteCategory, canonicalUrl, hostOf, isDetailPage, isIgnored, needsPropertyUrl, siteFor, unknownSite, urlNamesProperty } from './sites.ts';

export interface Finding {
  id: string; // stable hash of the canonical URL
  url: string;
  canonicalUrl: string;
  domain: string;
  siteKey: string;
  siteName: string;
  category: SiteCategory;
  media: MediaType[];
  title: string;
  snippet: string;
  thumbnails: string[];
  confidence: Exclude<MatchLevel, 'none'>;
  evidence: string[]; // codes: street, suffix, unit, zip, city, state, portal_lookup, other_unit, unit_missing
  foundVia: string[];
  playbook: string;
  coveredBy?: string; // e.g. trulia is removed through zillow
  missedRuns?: number; // consecutive re-scans that didn't see this page (kept on the stored copy only)
  /** Whether the page still shows photos: seen (Google showed one, or we saw them), none, or unknown (site blocks checks). */
  photos?: PhotoStatus;
}

export interface DirectCheck {
  siteKey: string;
  siteName: string;
  url: string; // a search page on that site (labelled as a search, never as a finding)
  playbook: string;
}

export interface ScanDiagnostics {
  provider: string;
  queries: number;
  queryErrors: { label: string; code: string; detail?: string }[];
  lookups: { key: string; ok: boolean; found: number; error?: string }[];
  candidates: number;
  rejected: Record<string, number>;
  durationMs: number;
  searchMode?: string;
}

export interface ScanResult {
  address: Address;
  display: string;
  findings: Finding[];
  checks: DirectCheck[];
  diagnostics: ScanDiagnostics;
  scannedAt: string;
}

export function buildQueries(a: Address): SearchQuery[] {
  const phrases = streetPhrases(a);
  const loc = `${a.city} ${a.state}`;
  const qs: SearchQuery[] = [
    { label: 'general', kind: 'web', phrases, extra: `${loc}${a.zip ? ` ${a.zip}` : ''}`.trim() },
    { label: 'zip', kind: 'web', phrases, extra: a.zip ?? a.city },
    ...SEARCH_GROUPS.map((g) => ({ label: g.label, kind: 'web' as const, phrases, extra: a.city, sites: g.domains })),
    { label: 'media_words', kind: 'web', phrases, extra: `${a.city} ("virtual tour" OR "3D tour" OR "floor plan" OR video OR photos)` },
    { label: 'images', kind: 'images', phrases, extra: loc },
    // The big portals block page checks, so ask Google Images which of their pages show this home's photos.
    { label: 'images_portals', kind: 'images', phrases, extra: a.city, sites: ['zillow.com', 'realtor.com', 'redfin.com', 'trulia.com', 'homes.com', 'compass.com', 'coldwellbankerhomes.com', 'century21.com'] },
    { label: 'videos', kind: 'videos', phrases, extra: a.city },
    // Plain-text searches that stand in for the site: searches on search plans that don't allow operators.
    ...['plain_mls', 'plain_sold', 'plain_idx', 'plain_agent'].map((label) => ({ label, kind: 'web' as const, phrases, extra: `${loc}${a.zip ? ` ${a.zip}` : ''}`.trim(), fallbackOnly: true })),
  ];
  if (a.unit) qs.push({ label: 'unit', kind: 'web', phrases: phrases.map((p) => `${p} ${a.unit!.toUpperCase()}`), extra: a.city });
  return qs;
}

const MEDIA_WORDS: [RegExp, MediaType][] = [
  [/\b(3d|virtual|360|matterport|walk[- ]?through)\b.*\btour|\btour\b.*\b(3d|virtual|360)\b|matterport/i, 'tour'],
  [/\bfloor ?plans?\b/i, 'floorplan'],
  [/\bvideo|drone|youtube|vimeo|reel\b/i, 'video'],
  [/\bphotos?\b|\bpictures?\b|\bimages?\b|\bgallery\b/i, 'photos'],
];

function detectMedia(site: Site, c: Candidate): MediaType[] {
  const set = new Set<MediaType>(site.media);
  const text = `${c.title} ${c.snippet}`;
  for (const [re, m] of MEDIA_WORDS) if (re.test(text)) set.add(m);
  if (c.thumbnail) set.add('photos');
  if (c.via.startsWith('videos')) set.add('video');
  return [...set];
}

function siteRank(key: string): number {
  const i = SITES.findIndex((s) => s.key === key);
  return i === -1 ? 999 : i;
}

const SUFFIX_SET = new Set(Object.values(SUFFIXES));
const CATEGORY_ORDER: SiteCategory[] = ['portal', 'tour', 'property_site', 'video', 'brokerage', 'rental', 'social', 'other'];

export function hashId(s: string): string {
  // FNV-1a 32-bit, hex. Stable across runtimes.
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Turn raw candidates into verified findings. Pure and deterministic. */
export function evaluate(a: Address, candidates: Candidate[], rejected: Record<string, number> = {}): Finding[] {
  const bump = (k: string) => (rejected[k] = (rejected[k] ?? 0) + 1);
  const byUrl = new Map<string, Finding>();
  for (const c of candidates) {
    if (!c.url || !/^https?:\/\//i.test(c.url)) { bump('bad_url'); continue; }
    if (isIgnored(c.url)) { bump('ignored_site'); continue; }
    const site = siteFor(c.url) ?? unknownSite(c.url);
    const isLookup = c.via.startsWith('lookup:');
    if (!isLookup && !isDetailPage(site, c.url)) { bump('not_a_property_page'); continue; }
    // Agent sites we have no rules for: the URL must point at one property, not an area page that mentions ours.
    if (!isLookup && needsPropertyUrl(site) && !urlNamesProperty(c.url, a.number, a.zip)) { bump('not_a_property_page'); continue; }

    // Match on the URL slug first (strongest), then on URL + title + snippet.
    // Social post links glue words together ("j-u-s-t-l-i-s-t-e-d5062-perth-street"), so split letters from digits.
    const slug = site.category === 'social' ? urlText(c.url).replace(/([a-z])(\d)/g, '$1 $2') : urlText(c.url);
    const text = isLookup ? `${c.addressText ?? ''}` : `${slug} | ${c.title} | ${c.snippet}`;
    const m = matchAddress(a, text);
    if (m.level === 'none') { bump('address_mismatch'); continue; }
    // Social posts and videos: a search snippet can quote a page's other posts. Only call it exact when
    // the post's own link or title names the home; a snippet-only match is shown as a possible match.
    // Facebook and Instagram snippets often quote a page's other posts, so a social post must name the home in
    // its own link or title; a snippet-only match was nearly always a post about another home.
    if (!isLookup && (site.category === 'social' || site.category === 'video')
      && matchAddress(a, `${slug} | ${c.title}`).level === 'none') {
      if (site.category === 'social') { bump('social_snippet_only'); continue; }
      if (m.level === 'exact') m.level = 'likely';
    }
    // Condos: a slug like ".../103-2727-w-43rd-st" names unit 103 of our building, not unit 402.
    if (!isLookup && a.unit && otherUnitInSlug(a, c.url)) { bump('other_unit'); continue; }
    // Rental sites' building pages ("2727 W 43rd St Apartments") don't show a given condo unit.
    if (!isLookup && a.unit && site.category === 'rental' && m.reasons.includes('unit_missing')) { bump('building_page'); continue; }
    // A slug that names a *different* house number on the same street is a different property even if the snippet mentions ours.
    if (!isLookup && slugContradicts(a, slug)) { bump('slug_contradiction'); continue; }

    const key = canonicalUrl(c.url);
    const existing = byUrl.get(key);
    const evidence = [...m.reasons, ...(isLookup ? ['portal_lookup'] : [])];
    if (existing) {
      existing.foundVia = [...new Set([...existing.foundVia, c.via])];
      existing.evidence = [...new Set([...existing.evidence, ...evidence])];
      if (c.thumbnail && !existing.thumbnails.includes(c.thumbnail)) existing.thumbnails.push(c.thumbnail);
      for (const md of detectMedia(site, c)) if (!existing.media.includes(md)) existing.media.push(md);
      if (m.level === 'exact') existing.confidence = 'exact';
      if (!existing.title && c.title) existing.title = c.title;
      if (!existing.snippet && c.snippet) existing.snippet = c.snippet;
      continue;
    }
    byUrl.set(key, {
      id: hashId(key),
      url: c.url,
      canonicalUrl: key,
      domain: hostOf(c.url),
      siteKey: site.key,
      siteName: site.name,
      category: site.category,
      media: detectMedia(site, c),
      title: c.title,
      snippet: c.snippet,
      thumbnails: c.thumbnail ? [c.thumbnail] : [],
      confidence: m.level,
      evidence,
      foundVia: [c.via],
      playbook: site.playbook,
    });
  }
  const findings = [...byUrl.values()];
  // A brand page known only from a sister site's listing id (never seen in search) is shown as a possible match:
  // the listing is the same, but that brand may have taken its copy down.
  for (const f of findings) {
    if (f.foundVia.every((v) => v === 'derived:anywhere')) {
      f.confidence = 'likely';
      if (!f.evidence.includes('same_listing_id')) f.evidence.push('same_listing_id');
    } else if (f.foundVia.some((v) => v.startsWith('derived:')) && !f.evidence.includes('same_listing_id')) f.evidence.push('same_listing_id');
  }
  findings.sort((x, y) =>
    (x.confidence === 'exact' ? 0 : 1) - (y.confidence === 'exact' ? 0 : 1) ||
    CATEGORY_ORDER.indexOf(x.category) - CATEGORY_ORDER.indexOf(y.category) ||
    siteRank(x.siteKey) - siteRank(y.siteKey) ||
    y.media.length - x.media.length ||
    x.domain.localeCompare(y.domain));
  return findings;
}

/**
 * True when the URL path itself spells out a street address that is not ours
 * (e.g. /home/4996-n-malaya-st-denver-co-80249 whose snippet merely mentions our address nearby).
 */
function slugContradicts(a: Address, slug: string): boolean {
  const toks = canonTokens(slug);
  const looksLikeAddress = toks.some((t, i) => /^\d+[a-z]?$/.test(t) && toks.slice(i + 1, i + 6).some((x) => SUFFIX_SET.has(x)) && /^[a-z]/.test(toks[i + 1] ?? ''));
  if (!looksLikeAddress) return false;
  const num = rawTokens(a.number);
  const street = a.street.split(' ').map(canon);
  for (let i = 0; i < toks.length; i++) {
    if (num.every((n, j) => toks[i + j] === n)) {
      let k = i + num.length;
      // A direction before the street must be ours: "4138 W Tanglewood" is not "4138 E Tanglewood".
      const dirHere = toks[k] && toks[k].length <= 2 && toks[k] !== street[0] && DIRECTIONS[toks[k]] ? DIRECTIONS[toks[k]] : undefined;
      if (dirHere && a.preDir && dirHere !== DIRECTIONS[a.preDir]) continue;
      if (toks[k] && toks[k].length <= 2 && toks[k] !== street[0]) k++;
      if (street.every((w, j) => toks[k + j] === w)) return false;
    }
  }
  return true;
}

/** True when the URL's last path parts put a different unit number right before our house number ("103-2727-w-43rd"). */
export function otherUnitInSlug(a: Address, url: string): boolean {
  let path = '';
  try { path = decodeURIComponent(new URL(url).pathname).toLowerCase(); } catch { return false; }
  const num = a.number.toLowerCase();
  const unit = a.unit!.toLowerCase();
  for (const part of path.split('/')) {
    const m = part.match(new RegExp(`^(?:unit-|apt-|ste-)?([a-z]?\\d{1,5}[a-z]?)-${num.replace(/[^a-z0-9]/g, '')}-`));
    if (m && m[1] !== unit) return true;
  }
  return false;
}

// ─── Sister-site pages ─────────────────────────────────────────────────────
// Some sites share one listing id, so a page found on one points to the same listing on the others.
// These URLs are built from ids in pages that search already found and matched to this address;
// nothing is guessed. Checked on the Nov 2026 test homes:
// - Trulia's home id is Zillow's zpid: trulia.com/home/<address>-<zpid>.
// - Century 21, ERA, Better Homes and Gardens and Coldwell Banker (all Anywhere brands) share "lid-" ids.
// - HomeFinder and Realtor.com share property ids (M12345-67890).

const ANYWHERE_PATHS: Record<string, string> = {
  'century21.com': 'https://www.century21.com/homes/detail',
  'era.com': 'https://www.era.com/property/detail',
  'bhgre.com': 'https://www.bhgre.com/home/detail',
  'coldwellbanker.com': 'https://www.coldwellbanker.com',
};

function addressSlug(a: Address): string | null {
  if (!a.zip || a.unit) return null;
  return [a.number, a.preDir, a.street, a.suffix, a.city, a.state, a.zip]
    .filter(Boolean).join(' ').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function siblingCandidates(a: Address, findings: Finding[]): Candidate[] {
  const out: Candidate[] = [];
  const title = displayAddress(a);
  for (const f of findings) {
    if (f.confidence !== 'exact') continue;
    if (f.siteKey === 'zillow') {
      const zpid = f.url.match(/(\d+)_zpid/)?.[1];
      const slug = addressSlug(a);
      if (zpid && slug) out.push({ url: `https://www.trulia.com/home/${slug}-${zpid}`, title, snippet: '', via: 'derived:zillow' });
    }
    const lid = f.url.match(/\/([a-z]{2})\/([^/]+)\/([^/]+)\/(lid-[A-Za-z0-9]+)/);
    if (lid && Object.keys(ANYWHERE_PATHS).some((d) => f.domain === d || f.domain.endsWith('.' + d))) {
      for (const base of Object.values(ANYWHERE_PATHS)) out.push({ url: `${base}/${lid[1]}/${lid[2]}/${lid[3]}/${lid[4]}`, title, snippet: '', via: 'derived:anywhere' });
    }
    if (f.siteKey === 'homefinder') {
      const p = f.url.match(/\/realestateandhomes-detail\/[^/?#]+/)?.[0];
      if (p) out.push({ url: `https://www.realtor.com${p}`, title, snippet: '', via: 'derived:homefinder' });
    }
  }
  return out;
}

/**
 * Label each finding with whether it still shows photos. Google showing an image from the page counts as
 * seen. Otherwise, when allowed, open the page (all at once, at most ~6 seconds in total).
 */
const PHOTO_DEADLINE_MS = 7000;
export async function labelPhotos(findings: Finding[], fetchFn: FetchLike | null): Promise<void> {
  // An image result can point at another link to the same page (".../70333738_zpid/" vs ".../14425-...-/70333738_zpid/").
  // Same site and the same listing id means the same page.
  const ids = (f: Finding) => new Set(f.url.match(/\d{6,}|lid-[A-Za-z0-9]+|M\d{5}-\d{5}/g) ?? []);
  const withPics = findings.filter((f) => f.thumbnails.length);
  const todo: Finding[] = [];
  for (const f of findings) {
    const mine = ids(f);
    if (!f.thumbnails.length && mine.size && withPics.some((g) => g.siteKey === f.siteKey && [...ids(g)].some((t) => mine.has(t)))) f.photos = 'seen';
    else if (f.thumbnails.length) f.photos = 'seen';
    else if (fetchFn && f.category !== 'social' && f.category !== 'video' && canFetch(f.domain)) todo.push(f);
    else f.photos = 'unknown';
  }
  // Hard cap: whatever hasn't answered in 7 seconds stays "unknown", so the check can never hold up a scan.
  const results: { status: PhotoStatus; image?: string }[] = todo.map(() => ({ status: 'unknown' }));
  const work = todo.slice(0, 40).map((f, i) => checkPage(f.url, fetchFn!).then((r) => { results[i] = r; }));
  await Promise.race([Promise.all(work), new Promise((r) => setTimeout(r, PHOTO_DEADLINE_MS))]);
  todo.forEach((f, i) => {
    f.photos = results[i].status;
    // The page's own share photo, shown on the report as proof of what the page shows.
    if (results[i].image && !f.thumbnails.includes(results[i].image!)) f.thumbnails.push(results[i].image!);
  });
}

/**
 * Fill-in searches for national sites the first round didn't find. Google gives a big site's whole street
 * to a site: search (neighbors on the same street fill the page), so each search asks for only 2 sites, then 3
 * for the less important ones, up to 10 searches. For a condo the unit number is added as a plain word.
 */
export function fillQueries(a: Address, prelim: Finding[]): SearchQuery[] {
  const have = prelim.filter((f) => f.confidence === 'exact').map((f) => f.domain);
  const missing = NAMED_FILL_DOMAINS
    .filter((d) => d !== 'har.com' || a.state === 'TX') // HAR only lists Texas homes
    .filter((d) => !have.some((h) => h === d || h.endsWith('.' + d)));
  const out: SearchQuery[] = [];
  const extra = a.unit ? `${a.city} ${a.unit.toUpperCase()}` : a.city;
  for (let i = 0; i < missing.length && out.length < 10;) {
    const n = out.length < 6 ? 2 : 3;
    out.push({ label: 'fill', kind: 'web', phrases: streetPhrases(a), extra, sites: missing.slice(i, i + n), num: 20 });
    i += n;
  }
  return out;
}

const ZILLOW_FAMILY = new Set(['zillow', 'trulia', 'hotpads']); // share Zillow's property ids, not MLS numbers

/**
 * MLS numbers for this home: ids in the URLs of exact matches on at least two unrelated sites
 * (e.g. "3777682" in atproperties.com/3777682/... and bhhstx.com/property/105-3777682-...). Up to two.
 */
export function listingIds(findings: Finding[]): string[] {
  const byCore = new Map<string, { sites: Set<string>; forms: Map<string, number> }>();
  for (const f of findings) {
    if (f.confidence !== 'exact') continue;
    let path = '';
    try { const u = new URL(f.url); path = decodeURIComponent(u.pathname + u.search).toLowerCase(); } catch { continue; }
    const site = ZILLOW_FAMILY.has(f.siteKey) ? 'zillow' : f.domain.split('.').slice(-2).join('.');
    for (const t of new Set(path.split(/[^a-z0-9]+/))) {
      const m = t.match(/^([a-z]{0,5}?)(\d{6,9})$/);
      if (!m) continue;
      const e = byCore.get(m[2]) ?? { sites: new Set<string>(), forms: new Map<string, number>() };
      e.sites.add(site);
      e.forms.set(t, (e.forms.get(t) ?? 0) + 1);
      byCore.set(m[2], e);
    }
  }
  return [...byCore.values()]
    .filter((e) => [...e.sites].filter((x) => x !== 'zillow').length >= 2)
    .sort((x, y) => y.sites.size - x.sites.size)
    .slice(0, 2)
    .map((e) => [...e.forms].sort((x, y) => y[1] - x[1] || x[0].length - y[0].length)[0][0]);
}

function addCoveredSiblings(findings: Finding[]): Finding[] {
  // Trulia and HotPads show Zillow's listing data; removing photos on Zillow removes them there too.
  const hasZillow = findings.some((f) => f.siteKey === 'zillow');
  for (const f of findings) if (hasZillow && (f.siteKey === 'trulia' || f.siteKey === 'hotpads')) f.coveredBy = 'zillow';
  return findings;
}

export function directChecks(a: Address, findings: Finding[]): DirectCheck[] {
  const found = new Set(findings.map((f) => f.siteKey));
  const line = streetLine(a, { unit: false });
  const full = `${streetLine(a)}, ${a.city}, ${a.state} ${a.zip ?? ''}`.trim();
  const google = (site: string) => `https://www.google.com/search?q=${encodeURIComponent(`"${line}" ${a.city} site:${site}`)}`;
  const checks: DirectCheck[] = [
    { siteKey: 'zillow', siteName: 'Zillow', url: `https://www.zillow.com/homes/${encodeURIComponent(full.replace(/\s+/g, '-'))}_rb/`, playbook: 'zillow' },
    { siteKey: 'redfin', siteName: 'Redfin', url: google('redfin.com'), playbook: 'redfin' },
    { siteKey: 'realtor', siteName: 'Realtor.com', url: google('realtor.com'), playbook: 'realtor' },
    { siteKey: 'homes', siteName: 'Homes.com', url: google('homes.com'), playbook: 'homes' },
    { siteKey: 'trulia', siteName: 'Trulia', url: google('trulia.com'), playbook: 'trulia' },
    { siteKey: 'matterport', siteName: 'Matterport', url: google('matterport.com'), playbook: 'matterport' },
    { siteKey: 'youtube', siteName: 'YouTube', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${line} ${a.city}`)}`, playbook: 'youtube' },
  ];
  return checks.filter((c) => !found.has(c.siteKey));
}

export interface EngineOptions {
  provider: SearchProvider | null;
  fetchFn?: FetchLike;
  lookups?: PortalLookup[];
  timeoutMs?: number;
  concurrency?: number;
  /** Open pages that allow it to see whether they still show photos (no search credits; a few seconds). */
  checkPhotos?: boolean;
}

async function withTimeout<T>(ms: number, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fn(ctl.signal);
  } finally {
    clearTimeout(t);
  }
}

export async function runScan(a: Address, opts: EngineOptions): Promise<ScanResult> {
  const started = Date.now();
  const fetchFn = opts.fetchFn ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 20000; // includes waiting for a slot under the search provider's rate limit
  const candidates: Candidate[] = [];
  const diagnostics: ScanDiagnostics = {
    provider: opts.provider?.name ?? 'none', queries: 0, queryErrors: [], lookups: [], candidates: 0, rejected: {}, durationMs: 0,
  };

  const lookupLine = `${streetLine(a)} ${a.city} ${a.state} ${a.zip ?? ''}`.trim();
  const lookupLineNoPostDir = a.postDir ? `${streetLine({ ...a, postDir: undefined })} ${a.city} ${a.state} ${a.zip ?? ''}`.trim() : null;

  const lookupTasks = (opts.lookups ?? PORTAL_LOOKUPS).map(async (l) => {
    try {
      let rows = await withTimeout(timeoutMs, (s) => l.run(lookupLine, fetchFn, s));
      // Zillow's autocomplete sometimes only matches after dropping a trailing directional ("SE").
      if (rows.length === 0 && lookupLineNoPostDir) rows = await withTimeout(timeoutMs, (s) => l.run(lookupLineNoPostDir, fetchFn, s));
      candidates.push(...rows);
      diagnostics.lookups.push({ key: l.key, ok: true, found: rows.length });
    } catch (e) {
      diagnostics.lookups.push({ key: l.key, ok: false, found: 0, error: e instanceof ProviderError ? e.code : 'network' });
    }
  });

  const queries = opts.provider ? buildQueries(a) : [];
  diagnostics.queries = queries.length;
  const queue = [...queries];
  const worker = async () => {
    for (let q = queue.shift(); q; q = queue.shift()) {
      try {
        const rows = await withTimeout(timeoutMs, (s) => opts.provider!.search(q!, s));
        candidates.push(...rows);
      } catch (e) {
        diagnostics.queryErrors.push({ label: q.label, code: e instanceof ProviderError ? e.code : 'network', detail: String((e as Error)?.message ?? '').slice(0, 200) });
      }
    }
  };
  await Promise.all([...lookupTasks, ...Array.from({ length: opts.concurrency ?? 8 }, worker)]);

  // Second round: fill in the national sites the first round missed, a few at a time, so each gets room in
  // Google's results (mixed results vary from run to run). The MLS-number search (listingIds) is no longer
  // run: it mostly found small agent sites, which aren't worth the searches.
  if (opts.provider) {
    candidates.push(...siblingCandidates(a, evaluate(a, candidates, {})));
    const prelim = evaluate(a, candidates, {});
    const round2: SearchQuery[] = fillQueries(a, prelim);
    diagnostics.queries += round2.length;
    queue.push(...round2);
    await Promise.all(Array.from({ length: Math.min(round2.length, opts.concurrency ?? 8) }, worker));
  }

  candidates.push(...siblingCandidates(a, evaluate(a, candidates, {})));
  diagnostics.searchMode = opts.provider?.mode?.();
  diagnostics.candidates = candidates.length;
  const findings = addCoveredSiblings(evaluate(a, candidates, diagnostics.rejected));
  await labelPhotos(findings, opts.checkPhotos ? fetchFn : null);
  diagnostics.durationMs = Date.now() - started;
  return {
    address: a,
    display: displayAddress(a),
    findings,
    checks: directChecks(a, findings),
    diagnostics,
    scannedAt: new Date().toISOString(),
  };
}

/**
 * True when the results can't be trusted as complete: every search failed (e.g. the search account ran out
 * of credits), or there were no searches and every lookup failed. A Zillow-only result would look like a
 * clean report with one page, so it's treated as a failure and nothing is cached.
 */
export function scanFailed(r: ScanResult): boolean {
  const lookupsOk = r.diagnostics.lookups.some((l) => l.ok);
  if (r.diagnostics.queries > 0) return r.diagnostics.queryErrors.length >= r.diagnostics.queries;
  return !lookupsOk;
}
