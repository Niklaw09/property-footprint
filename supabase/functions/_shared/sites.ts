// Registry of sites that host property photos, tours, videos, floor plans and listing pages.
// `detail` decides whether a URL is a single-property page (and not a city search page that
// happens to mention the address in its snippet).

export type SiteCategory =
  | 'portal' // national listing portals
  | 'brokerage' // brokerage / agent / IDX websites
  | 'tour' // 3D and virtual tour hosts
  | 'property_site' // single-property marketing websites from photographers
  | 'video'
  | 'social'
  | 'rental'
  | 'other';

export type MediaType = 'photos' | 'tour' | 'video' | 'floorplan' | 'listing';

export interface Site {
  key: string;
  name: string;
  domains: string[]; // registrable domains, matched on the host suffix
  category: SiteCategory;
  media: MediaType[]; // what this kind of page typically shows
  detail?: RegExp; // tested against pathname + search
  playbook: string; // key into PLAYBOOKS
}

export const SITES: Site[] = [
  // National portals
  { key: 'zillow', name: 'Zillow', domains: ['zillow.com'], category: 'portal', media: ['listing', 'photos'], detail: /\/homedetails\/|_zpid/, playbook: 'zillow' },
  { key: 'trulia', name: 'Trulia', domains: ['trulia.com'], category: 'portal', media: ['listing', 'photos'], detail: /\/home\/|\/p\/[a-z]{2}\//, playbook: 'trulia' },
  { key: 'hotpads', name: 'HotPads', domains: ['hotpads.com'], category: 'rental', media: ['listing', 'photos'], detail: /\/[^/]+\/(pad|building)/, playbook: 'zillow_rentals' },
  { key: 'redfin', name: 'Redfin', domains: ['redfin.com'], category: 'portal', media: ['listing', 'photos'], detail: /\/home\/\d+/, playbook: 'redfin' },
  { key: 'realtor', name: 'Realtor.com', domains: ['realtor.com'], category: 'portal', media: ['listing', 'photos'], detail: /realestateandhomes-detail|\/rentals\/details\//, playbook: 'realtor' },
  // Homefinder is run by Realtor.com's owner and shares its property ids; removing on Realtor.com covers it.
  { key: 'homefinder', name: 'HomeFinder', domains: ['homefinder.com'], category: 'portal', media: ['listing', 'photos'], detail: /realestateandhomes-detail/, playbook: 'realtor' },
  { key: 'homes', name: 'Homes.com', domains: ['homes.com'], category: 'portal', media: ['listing', 'photos'], detail: /\/property\//, playbook: 'homes' },
  { key: 'movoto', name: 'Movoto', domains: ['movoto.com'], category: 'portal', media: ['listing', 'photos'], detail: /\/home\/|-\d{6,}\/?$|\/pid_/, playbook: 'movoto' },
  { key: 'estately', name: 'Estately', domains: ['estately.com'], category: 'portal', media: ['listing', 'photos'], detail: /\/listings\/info\//, playbook: 'estately' },
  { key: 'har', name: 'HAR.com', domains: ['har.com'], category: 'portal', media: ['listing', 'photos'], detail: /\/homedetail\//, playbook: 'har' },
  { key: 'houzeo', name: 'Houzeo', domains: ['houzeo.com'], category: 'portal', media: ['listing', 'photos'], detail: /\/homes\//, playbook: 'houzeo' },
  { key: 'point2', name: 'Point2', domains: ['point2homes.com'], category: 'portal', media: ['listing', 'photos'], detail: /\/US\/Home-For-Sale\/|\/US\/.*Details/i, playbook: 'generic_portal' },
  { key: 'tophap', name: 'TopHap', domains: ['tophap.com'], category: 'portal', media: ['listing', 'photos'], detail: /\/listings\/|\/property\//, playbook: 'generic_portal' },
  { key: 'beycome', name: 'Beycome', domains: ['beycome.com'], category: 'portal', media: ['listing', 'photos'], playbook: 'generic_portal' },
  { key: 'xome', name: 'Xome', domains: ['xome.com'], category: 'portal', media: ['listing', 'photos'], detail: /\/realestate\/|\/homes-for-sale\/.+\d/, playbook: 'generic_portal' },
  { key: 'opendoor', name: 'Opendoor', domains: ['opendoor.com'], category: 'portal', media: ['listing', 'photos'], detail: /\/homes\//, playbook: 'generic_portal' },
  { key: 'fsbo', name: 'ForSaleByOwner', domains: ['forsalebyowner.com', 'fsbo.com', 'byowner.com'], category: 'portal', media: ['listing', 'photos'], playbook: 'generic_portal' },

  // Big brokerages (IDX)
  { key: 'compass', name: 'Compass', domains: ['compass.com'], category: 'brokerage', media: ['listing', 'photos'], detail: /\/homedetails\/|\/listing\//, playbook: 'compass' },
  { key: 'coldwellbanker', name: 'Coldwell Banker', domains: ['coldwellbankerhomes.com', 'coldwellbanker.com'], category: 'brokerage', media: ['listing', 'photos'], detail: /\/pid_\d+|\/property\/|\/lid-/, playbook: 'anywhere' },
  { key: 'century21', name: 'Century 21', domains: ['century21.com'], category: 'brokerage', media: ['listing', 'photos'], detail: /\/property\/|\/homes\/detail\//, playbook: 'anywhere' },
  { key: 'sothebys', name: "Sotheby's International Realty", domains: ['sothebysrealty.com'], category: 'brokerage', media: ['listing', 'photos'], detail: /\/eng\/sales\/detail\//, playbook: 'anywhere' },
  { key: 'bhgre', name: 'Better Homes and Gardens Real Estate', domains: ['bhgre.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'anywhere' },
  { key: 'era', name: 'ERA', domains: ['era.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'anywhere' },
  { key: 'remax', name: 'RE/MAX', domains: ['remax.com'], category: 'brokerage', media: ['listing', 'photos'], detail: /\/home-details\/|\/[a-z]{2}\/[^/]+\/home-details|\/homes-for-sale\/.+\/\d/, playbook: 'brokerage' },
  { key: 'kw', name: 'Keller Williams', domains: ['kw.com', 'kwrealty.com'], category: 'brokerage', media: ['listing', 'photos'], detail: /\/property\/|\/listing\//, playbook: 'brokerage' },
  { key: 'bhhs', name: 'Berkshire Hathaway HomeServices', domains: ['bhhs.com', 'bhhstx.com', 'bhhsgeorgia.com', 'bhhscarolinas.com', 'bhhsnw.com', 'bhhsrep.com', 'bhhsamb.com', 'bhhscalifornia.com', 'bhhsfloridarealty.com', 'bhhsnwrealestate.com'], category: 'brokerage', media: ['listing', 'photos'], detail: /\/[^/]+\/\d+|\/property\//, playbook: 'brokerage' },
  { key: 'exp', name: 'eXp Realty', domains: ['exprealty.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'corcoran', name: 'Corcoran', domains: ['corcoran.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'anywhere' },
  { key: 'elliman', name: 'Douglas Elliman', domains: ['elliman.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'windermere', name: 'Windermere', domains: ['windermere.com', 'withwre.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'weichert', name: 'Weichert', domains: ['weichert.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'harrynorman', name: 'Harry Norman Realtors', domains: ['harrynorman.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'cryeleike', name: 'Crye-Leike', domains: ['crye-leike.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'howardhanna', name: 'Howard Hanna', domains: ['howardhanna.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'real', name: 'Real Brokerage', domains: ['onereal.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'fathom', name: 'Fathom Realty', domains: ['fathomrealty.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'homesmart', name: 'HomeSmart', domains: ['homesmart.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'lpt', name: 'LPT Realty', domains: ['lptrealty.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'realtyonegroup', name: 'Realty ONE Group', domains: ['realtyonegroup.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'engelvolkers', name: 'Engel & Völkers', domains: ['evrealestate.com', 'engelvoelkers.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'longfoster', name: 'Long & Foster', domains: ['longandfoster.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'anywhere' },
  { key: 'unitedre', name: 'United Real Estate', domains: ['unitedrealestate.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'atproperties', name: '@properties', domains: ['atproperties.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'realty', name: 'Realty.com', domains: ['realty.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'bexrealty', name: 'Bex Realty', domains: ['bexrealty.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' },
  { key: 'realgeeks', name: 'Agent website (Real Geeks)', domains: ['realgeeks.com'], category: 'brokerage', media: ['listing', 'photos'], detail: /\/property\//, playbook: 'idx_platform' },
  { key: 'unionstmedia', name: 'Agent website (Union Street Media)', domains: ['unionstmedia.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'idx_platform' },
  { key: 'rdesk', name: 'Agent website (rDesk)', domains: ['rdeskwebsite.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'idx_platform' },
  { key: 'idxbroker', name: 'Agent website (IDX Broker)', domains: ['idxbroker.com'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'idx_platform' },
  { key: 'lofty', name: 'Agent website (Lofty)', domains: ['lofty.me', 'chime.me'], category: 'brokerage', media: ['listing', 'photos'], playbook: 'idx_platform' },
  { key: 'realtracs', name: 'RealTracs (MLS)', domains: ['realtracs.com'], category: 'portal', media: ['listing', 'photos'], playbook: 'generic_portal' },
  { key: 'georgiamls', name: 'Georgia MLS', domains: ['georgiamls.com'], category: 'portal', media: ['listing', 'photos'], playbook: 'generic_portal' },

  // Tours and photographer property sites
  { key: 'matterport', name: 'Matterport', domains: ['matterport.com'], category: 'tour', media: ['tour', 'floorplan'], detail: /[?&]m=|\/show\//, playbook: 'matterport' },
  { key: 'iguide', name: 'iGUIDE', domains: ['youriguide.com', 'goiguide.com'], category: 'tour', media: ['tour', 'floorplan'], playbook: 'tour_host' },
  { key: 'cloudpano', name: 'CloudPano', domains: ['cloudpano.com'], category: 'tour', media: ['tour'], playbook: 'tour_host' },
  { key: 'kuula', name: 'Kuula', domains: ['kuula.co'], category: 'tour', media: ['tour'], playbook: 'tour_host' },
  { key: 'zillow3d', name: 'Zillow 3D Home', domains: ['zillow.com/view-3d-home'], category: 'tour', media: ['tour'], playbook: 'zillow' },
  { key: 'aryeo', name: 'Aryeo property website', domains: ['aryeo.com'], category: 'property_site', media: ['photos', 'video', 'tour', 'floorplan'], playbook: 'property_site' },
  { key: 'hdphotohub', name: 'HD Photo Hub property website', domains: ['hdphotohub.com'], category: 'property_site', media: ['photos', 'video', 'tour', 'floorplan'], playbook: 'property_site' },
  { key: 'tourbuzz', name: 'Tourbuzz property website', domains: ['tourbuzz.net'], category: 'property_site', media: ['photos', 'video', 'tour'], playbook: 'property_site' },
  { key: 'spiro', name: 'Spiro property website', domains: ['spiro.media'], category: 'property_site', media: ['photos', 'video', 'tour'], playbook: 'property_site' },
  { key: 'virtualtourcafe', name: 'VirtualTourCafe', domains: ['virtualtourcafe.com'], category: 'property_site', media: ['photos', 'tour'], playbook: 'property_site' },
  { key: 'tourfactory', name: 'TourFactory', domains: ['tourfactory.com'], category: 'property_site', media: ['photos', 'tour'], playbook: 'property_site' },
  { key: 'propertypanorama', name: 'Property Panorama', domains: ['propertypanorama.com'], category: 'property_site', media: ['photos', 'tour'], playbook: 'property_site' },
  { key: 'realtourvision', name: 'RTV property website', domains: ['rtvhd.com', 'realtourvision.com'], category: 'property_site', media: ['photos', 'tour', 'video'], playbook: 'property_site' },
  { key: 'snapshotsofhome', name: 'Property website', domains: ['listing.photos', 'tours.properties', 'mls.properties', 'sites.listing.photos'], category: 'property_site', media: ['photos', 'video', 'tour'], playbook: 'property_site' },

  // Video and social
  { key: 'youtube', name: 'YouTube', domains: ['youtube.com', 'youtu.be'], category: 'video', media: ['video'], detail: /watch\?v=|\/shorts\/|youtu\.be\//, playbook: 'youtube' },
  { key: 'vimeo', name: 'Vimeo', domains: ['vimeo.com'], category: 'video', media: ['video'], detail: /^\/\d+/, playbook: 'vimeo' },
  { key: 'facebook', name: 'Facebook', domains: ['facebook.com', 'fb.com'], category: 'social', media: ['photos', 'video'], playbook: 'facebook' },
  { key: 'instagram', name: 'Instagram', domains: ['instagram.com'], category: 'social', media: ['photos', 'video'], detail: /\/(p|reel)\//, playbook: 'instagram' },
  { key: 'pinterest', name: 'Pinterest', domains: ['pinterest.com'], category: 'social', media: ['photos'], detail: /\/pin\//, playbook: 'pinterest' },
  { key: 'tiktok', name: 'TikTok', domains: ['tiktok.com'], category: 'social', media: ['video'], detail: /\/video\//, playbook: 'tiktok' },

  // Rentals
  { key: 'apartments', name: 'Apartments.com', domains: ['apartments.com'], category: 'rental', media: ['listing', 'photos'], playbook: 'costar_rentals' },
  { key: 'apartmentfinder', name: 'ApartmentFinder', domains: ['apartmentfinder.com'], category: 'rental', media: ['listing', 'photos'], playbook: 'costar_rentals' },
  { key: 'zumper', name: 'Zumper', domains: ['zumper.com'], category: 'rental', media: ['listing', 'photos'], playbook: 'generic_portal' },
  { key: 'rent', name: 'Rent.com', domains: ['rent.com'], category: 'rental', media: ['listing', 'photos'], playbook: 'generic_portal' },
  { key: 'craigslist', name: 'Craigslist', domains: ['craigslist.org'], category: 'rental', media: ['listing', 'photos'], playbook: 'craigslist' },
];

// Sites never shown as findings: maps, people-search, schools, government, search engines, news.
// (People-search sites expose names, not property media; they are a different product.)
const IGNORED_DOMAINS = [
  'google.com', 'google.', 'bing.com', 'duckduckgo.com', 'yahoo.com', 'mapquest.com', 'apple.com', 'openstreetmap.org',
  'ownerly.com', 'neighborwho.com', 'countyoffice.org', 'propertyrecords.com', 'blockshopper.com', 'whitepages.com', 'spokeo.com', 'beenverified.com', 'truepeoplesearch.com',
  'fastpeoplesearch.com', 'radaris.com', 'peoplefinders.com', 'intelius.com', 'mylife.com', 'nuwber.com', 'clustrmaps.com',
  'usphonebook.com', 'thatsthem.com', 'searchpeoplefree.com', 'blockshopper.com', 'rehold.com', 'propertyshark.com',
  'ratemyagent.com', 'yelp.com', 'nextdoor.com', 'linkedin.com', 'wikipedia.org', 'greatschools.org', 'niche.com',
  'bizapedia.com', 'opencorporates.com', 'manta.com', 'yellowpages.com', 'bbb.org', 'zip-codes.com', 'unitedstateszipcodes.org',
];
const IGNORED_TLDS = ['.gov', '.edu', '.k12.', '.mil', '.us/'];

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function isIgnored(url: string): boolean {
  const host = hostOf(url);
  if (!host) return true;
  if (IGNORED_TLDS.some((t) => (host + '/').includes(t))) return true;
  return IGNORED_DOMAINS.some((d) => (d.endsWith('.') ? host.startsWith(d) || host.includes('.' + d) : host === d || host.endsWith('.' + d)));
}

export function siteFor(url: string): Site | undefined {
  const host = hostOf(url);
  let path = '';
  try { path = new URL(url).pathname; } catch { /* ignore */ }
  for (const s of SITES) {
    for (const d of s.domains) {
      if (d.includes('/')) {
        const [dh, dp] = [d.slice(0, d.indexOf('/')), d.slice(d.indexOf('/'))];
        if ((host === dh || host.endsWith('.' + dh)) && path.startsWith(dp)) return s;
      } else if (host === d || host.endsWith('.' + d)) return s;
    }
  }
  return undefined;
}

/** A site entry for a domain we don't know: an agent/brokerage page or other property page. */
export function unknownSite(url: string): Site {
  const host = hostOf(url);
  return { key: `web:${host}`, name: host, domains: [host], category: 'brokerage', media: ['listing', 'photos'], playbook: 'brokerage' };
}

// Area pages that list many homes, on any site: neighborhoods, communities, subdivisions, points of interest, schools.
// Calculator and financing pages hanging off a listing (e.g. har.com/homedetail/<id>/<id>/downpayment).
const SUBPAGE = /\/(downpayment|mortgage|affordability|calculator|financing)(\/|\?|$)/i;
const AREA_PAGE = /\/(neighbou?rhoods?|communit(y|ies)|subdivisions?|points-of-interest|schools?|market-(report|trends)|zip|zipcodes?|county|counties)(\/|$)/i;

export function isDetailPage(site: Site, url: string): boolean {
  try {
    const u = new URL(url);
    if (site.category !== 'social' && site.category !== 'video' && (AREA_PAGE.test(u.pathname) || SUBPAGE.test(u.pathname))) return false;
    if (!site.detail) return true;
    return site.detail.test(u.pathname + u.search) || site.detail.test(url);
  } catch {
    return false;
  }
}

/** Canonical URL used for de-duplication: no www, no fragment, no tracking query, no trailing slash. */
export function canonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    const keep = new Set(['m', 'v', 'id', 'pid', 'listingid', 'mls', 'mlsid']);
    for (const k of [...u.searchParams.keys()]) if (!keep.has(k.toLowerCase())) u.searchParams.delete(k);
    if (u.hostname === 'youtu.be') return `youtube.com/watch?v=${u.pathname.slice(1)}`;
    let s = `${u.hostname}${u.pathname}`.replace(/\/+$/, '');
    const q = u.searchParams.toString();
    if (q) s += `?${q}`;
    return s.toLowerCase();
  } catch {
    return url;
  }
}

/** Groups of sites searched together with (site:a OR site:b ...) — keeps the query budget small. */
export const SEARCH_GROUPS: { label: string; domains: string[] }[] = [
  // Focus (owner's call, Nov 2026): major portals, national brokerages, social and video. Small independent
  // agent sites still show up through the general searches, but no searches are spent on them.
  { label: 'portals', domains: ['zillow.com', 'redfin.com', 'realtor.com', 'trulia.com', 'homes.com', 'movoto.com', 'estately.com'] },
  { label: 'portals2', domains: ['houzeo.com', 'har.com', 'point2homes.com', 'xome.com', 'opendoor.com', 'beycome.com'] },
  { label: 'brokerages', domains: ['compass.com', 'coldwellbankerhomes.com', 'coldwellbanker.com', 'century21.com', 'bhhs.com', 'sothebysrealty.com'] },
  { label: 'brokerages2', domains: ['kw.com', 'exprealty.com', 'remax.com', 'era.com', 'bhgre.com', 'howardhanna.com', 'elliman.com', 'corcoran.com', 'windermere.com', 'weichert.com'] },
  { label: 'brokerages3', domains: ['onereal.com', 'fathomrealty.com', 'homesmart.com', 'lptrealty.com', 'realtyonegroup.com', 'evrealestate.com', 'longandfoster.com', 'unitedrealestate.com'] },
  { label: 'tours', domains: ['matterport.com', 'youriguide.com', 'aryeo.com', 'hdphotohub.com', 'tourbuzz.net', 'cloudpano.com', 'kuula.co', 'listing.photos', 'spiro.media', 'propertypanorama.com'] },
  { label: 'video', domains: ['youtube.com', 'vimeo.com', 'tiktok.com'] },
  { label: 'social', domains: ['facebook.com', 'instagram.com', 'pinterest.com'] },
  { label: 'rentals', domains: ['apartments.com', 'hotpads.com', 'zumper.com', 'rent.com', 'craigslist.org'] },
];

/**
 * True when the URL itself points at one property: it names the house number, or carries a listing id
 * (5+ digits, or letters followed by 6+ digits like an MLS number "TB8543033").
 * Used for agent sites we have no rules for, where a page about a neighborhood can mention our address in passing.
 */
export function urlNamesProperty(url: string, houseNumber: string, zip?: string): boolean {
  let path = '';
  try {
    const u = new URL(url);
    path = decodeURIComponent(u.pathname + u.search).toLowerCase();
  } catch {
    return false;
  }
  const toks = path.split(/[^a-z0-9]+/).filter(Boolean);
  const num = houseNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (num && toks.includes(num)) return true;
  return toks.some((t) => (/^\d{5,}$/.test(t) && t !== zip) || /^[a-z]{1,6}\d{6,}[a-z]?$/.test(t) || /^[a-z0-9]{10,}$/.test(t) && /\d/.test(t) && /[a-z]/.test(t));
}

/** Sites whose pages need the URL itself to point at one property (see urlNamesProperty). */
export function needsPropertyUrl(site: Site): boolean {
  return !site.detail && (site.category === 'brokerage' || site.category === 'portal' || site.category === 'rental' || site.category === 'other');
}

/**
 * National sites with a page for nearly every listed home. When the first round of searches misses one of
 * them (Google's mixed results vary from run to run), a fill-in search asks for just the missing ones.
 * The order is the priority when there are many to fill.
 */
export const NAMED_FILL_DOMAINS = [
  'realtor.com', 'homes.com', 'redfin.com', 'trulia.com', 'coldwellbankerhomes.com', 'century21.com', 'bhhs.com', 'compass.com',
  'kw.com', 'exprealty.com', 'remax.com', 'movoto.com', 'sothebysrealty.com', 'era.com', 'bhgre.com', 'coldwellbanker.com',
  'elliman.com', 'corcoran.com', 'windermere.com', 'howardhanna.com', 'atproperties.com', 'estately.com', 'houzeo.com', 'har.com',
  'weichert.com', 'youtube.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'matterport.com',
];

/** National brokerage brands: with portals, social and video, the sites the headline score counts. */
export const NATIONAL_BROKERAGES = new Set(['compass', 'coldwellbanker', 'century21', 'sothebys', 'bhgre', 'era', 'remax', 'kw', 'bhhs', 'exp', 'howardhanna', 'atproperties', 'corcoran', 'elliman', 'windermere', 'weichert', 'real', 'fathom', 'homesmart', 'lpt', 'realtyonegroup', 'engelvolkers', 'longfoster', 'unitedre']);

/** Priority sites: major portals, national brokerages, social and video. */
export function isPrioritySite(site: Site | undefined): boolean {
  if (!site) return false;
  return site.category === 'portal' || site.category === 'social' || site.category === 'video' || NATIONAL_BROKERAGES.has(site.key);
}

export function siteByKey(key: string): Site | undefined {
  return SITES.find((s) => s.key === key);
}
