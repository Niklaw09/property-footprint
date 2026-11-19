// Does a found page still show the home's photos?
//
// Two signals, neither costs search credits:
// 1. Google already showed us an image from the page (image-search results, or a result thumbnail).
// 2. For sites that allow it, fetch the page and look for listing photos: a real og:image, or several
//    photo-sized images from listing-photo hosts.
// The big portals block automated visits, so they are left "unknown" unless Google showed an image.
import type { FetchLike } from './providers.ts';

export type PhotoStatus = 'seen' | 'none' | 'unknown';

// Sites that answer automated requests with a bot wall; fetching them only wastes time.
const NO_FETCH = [
  'zillow.com', 'trulia.com', 'hotpads.com', 'redfin.com', 'realtor.com', 'homes.com', 'movoto.com', 'compass.com',
  'facebook.com', 'instagram.com', 'youtube.com', 'youtu.be', 'tiktok.com', 'pinterest.com', 'apartments.com',
  'apartmentfinder.com', 'zumper.com', 'rent.com', 'har.com', 'coldwellbankerhomes.com', 'century21.com',
];

// Placeholder images that mean "no photos": logos, "coming soon", default share images.
const PLACEHOLDER = /logo|default|placeholder|no[-_]?(photo|image)|coming[-_]?soon|blank|share[-_]?image|og[-_]?image|favicon|sprite|icon/i;
// Hosts and paths that serve MLS listing photos.
const LISTING_PHOTO = /(photos?|images?|media|listing|mls|idx|rets|property|cdn|cloudfront|amazonaws|rdcpix|zillowstatic|cdn-redfin|ssl\.cdn|listingphotos|mediaserver|bstatic|resize)/i;

export function canFetch(domain: string): boolean {
  return !NO_FETCH.some((d) => domain === d || domain.endsWith('.' + d));
}

/** Read up to `limit` characters of a page body. */
async function readSome(res: Response, limit: number): Promise<string> {
  if (!res.body) return (await res.text()).slice(0, limit);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let out = '';
  while (out.length < limit) {
    const { done, value } = await reader.read();
    if (done) break;
    out += dec.decode(value, { stream: true });
  }
  reader.cancel().catch(() => {});
  return out.slice(0, limit);
}

/** The page's own share image (og:image), when it looks like a listing photo rather than a logo. */
export function listingImage(html: string, pageUrl: string): string | undefined {
  const og = [...html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)(?::url)?["'][^>]*>/gi)]
    .map((m) => m[0].match(/content=["']([^"']+)["']/i)?.[1] ?? '')
    .filter(Boolean);
  for (const u of og) {
    if (PLACEHOLDER.test(u) || !LISTING_PHOTO.test(u)) continue;
    try {
      const abs = new URL(u.replace(/&amp;/g, '&'), pageUrl);
      if (abs.protocol === 'https:') return abs.toString();
    } catch { /* skip */ }
  }
  return undefined;
}

/** The page's HTML carries its content (share tags or structured data), so missing photos mean something. */
export function serverRendered(html: string): boolean {
  return /<meta[^>]+(?:property|name)=["']og:(?:title|description)["']/i.test(html) || /application\/ld\+json/i.test(html);
}

/** Decide from a page's HTML whether it shows listing photos. Exported for tests. */
export function htmlShowsPhotos(html: string): boolean {
  const og = [...html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/gi)]
    .map((m) => m[0].match(/content=["']([^"']+)["']/i)?.[1] ?? '')
    .filter(Boolean);
  if (og.some((u) => !PLACEHOLDER.test(u) && LISTING_PHOTO.test(u))) return true;
  const imgs = new Set(
    [...html.matchAll(/<(?:img|source)[^>]+(?:data-)?(?:src|srcset)=["']([^"'\s]+)/gi)]
      .map((m) => m[1])
      .filter((u) => /\.(jpe?g|webp)(\?|$)/i.test(u) || /\/photos?\//i.test(u))
      .filter((u) => !PLACEHOLDER.test(u) && LISTING_PHOTO.test(u)),
  );
  return imgs.size >= 3;
}

export interface PhotoCheck { status: PhotoStatus; image?: string }

export async function checkPhotos(url: string, fetchFn: FetchLike, timeoutMs = 6000): Promise<PhotoStatus> {
  return (await checkPage(url, fetchFn, timeoutMs)).status;
}

/** Open the page and report whether it shows photos, plus its share image to show the owner as proof. */
export async function checkPage(url: string, fetchFn: FetchLike, timeoutMs = 6000): Promise<PhotoCheck> {
  // Only public web pages: https, a real host name, no IP addresses or local names.
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' || !/\.[a-z]{2,}$/i.test(u.hostname) || /^[\d.]+$|^\[|localhost|\.local$|\.internal$/i.test(u.hostname)) return { status: 'unknown' };
  } catch {
    return { status: 'unknown' };
  }
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchFn(url, {
      // An honest bot name in the usual form; many sites turn away requests that don't look like a known client.
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HomePrintBot/1.0; +https://homeprint.online)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: ctl.signal,
      redirect: 'follow',
    });
    if (!res.ok || !/html/i.test(res.headers.get('content-type') ?? 'text/html')) return { status: 'unknown' };
    const html = await readSome(res, 400_000);
    // A page that only says "captcha"/"access denied" proves nothing.
    if (html.length < 2000 || /captcha|access denied|are you a robot|cf-chl/i.test(html.slice(0, 5000))) return { status: 'unknown' };
    // Pages built in the browser have no photos in their HTML at all; that proves nothing.
    if (!htmlShowsPhotos(html)) return { status: serverRendered(html) ? 'none' : 'unknown' };
    return { status: 'seen', image: listingImage(html, res.url || url) };
  } catch {
    return { status: 'unknown' };
  } finally {
    clearTimeout(t);
  }
}
