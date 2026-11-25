import { describe, it, expect } from 'vitest';
import { createService } from '@engine/service.ts';
import { memoryStore } from '@engine/memoryStore.ts';
import { fixtureProvider, type PortalLookup } from '@engine/providers.ts';
import { listingImage, checkPage } from '@engine/photos.ts';
import { labelPhotos, evaluate } from '@engine/engine.ts';
import { parseAddress } from '@engine/address.ts';

const zillow: PortalLookup = { key: 'zillow', async run() {
  return [{ url: 'https://www.zillow.com/homedetails/70333738_zpid/', title: '14425 American Kestrel Dr, Austin, TX 78738', snippet: '', via: 'lookup:zillow', addressText: '14425 American Kestrel Dr Austin TX 78738' }];
} };
const results = {
  general: [
    { url: 'https://www.estately.com/listings/info/14425-american-kestrel-dr-austin-tx-78738--2', title: '14425 American Kestrel Dr, Austin, TX 78738 | MLS# 3777682', snippet: '4 beds, 3 baths, 3,120 sq ft. See photos at www.estately.com/listings/info/x', via: '', thumbnail: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:abc' },
  ],
};

describe('proof before purchase', () => {
  it('locked results show the page title and snippet, but never the page link or a photo', async () => {
    const svc = createService({ store: memoryStore(), engine: () => ({ provider: fixtureProvider(results), lookups: [zillow] }) });
    const { view } = await svc.scan({ address: '14425 American Kestrel Dr, Austin, TX 78738', userId: null, ip: '1.1.1.1' });
    const locked = view.findings.filter((f) => f.locked) as any[];
    const est = locked.find((f) => f.domain === 'estately.com');
    expect(est.title).toContain('14425 American Kestrel Dr');
    expect(est.snippet).toContain('4 beds');
    expect(est.snippet).not.toContain('estately.com/listings');
    expect(est.thumb).toBeNull();
    expect(est.photos).toBe('seen');
    const json = JSON.stringify(locked);
    expect(json).not.toContain('estately.com/listings');
    expect(json).not.toContain('_zpid');
    expect(json).not.toContain('trulia.com/home');
  });

  it('keeps a page’s own listing photo (og:image) as proof', async () => {
    expect(listingImage('<meta property="og:image" content="https://photos.idx.com/abc/1.jpg?w=800&amp;h=600">', 'https://agent.com/p/1')).toBe('https://photos.idx.com/abc/1.jpg?w=800&h=600');
    expect(listingImage('<meta property="og:image" content="/images/logo.png">', 'https://agent.com/p/1')).toBeUndefined();
    expect(listingImage('<meta property="og:image" content="/media/listing/123.jpg">', 'https://agent.com/p/1')).toBe('https://agent.com/media/listing/123.jpg');
    const html = '<html>' + 'x'.repeat(3000) + '<meta property="og:image" content="https://cdn.listing-photos.com/9/1.jpg"></html>';
    const fetchFn = (async () => new Response(html, { headers: { 'content-type': 'text/html' } })) as any;
    expect(await checkPage('https://agent.com/property/14425-american-kestrel-dr', fetchFn)).toEqual({ status: 'seen', image: 'https://cdn.listing-photos.com/9/1.jpg' });
    const a = parseAddress('14425 American Kestrel Dr, Austin, TX 78738');
    const f = evaluate(a, [{ url: 'https://agent.com/property/14425-american-kestrel-dr-austin-tx-78738', title: '14425 American Kestrel Dr, Austin, TX 78738', snippet: '', via: 'search:general' }]);
    await labelPhotos(f, fetchFn);
    expect(f[0].thumbnails).toEqual(['https://cdn.listing-photos.com/9/1.jpg']);
  });
});
