import { describe, it, expect } from 'vitest';
import { parseAddress, matchAddress } from '@engine/address.ts';
import { runScan, scanFailed } from '@engine/engine.ts';
import { createService } from '@engine/service.ts';
import { memoryStore } from '@engine/memoryStore.ts';
import { fixtureProvider, PORTAL_LOOKUPS, type PortalLookup, type SearchProvider } from '@engine/providers.ts';
import { siteFor } from '@engine/sites.ts';

const lvl = (addr: string, text: string) => matchAddress(parseAddress(addr), text).level;

describe('address edge cases', () => {
  it('half addresses are their own address', () => {
    expect(parseAddress('123½ Main St, Springfield, IL 62704').number).toBe('123 1/2');
    expect(lvl('123 1/2 Main St, Springfield, IL 62704', '123 1/2 Main St, Springfield, IL 62704')).toBe('exact');
    expect(lvl('123 1/2 Main St, Springfield, IL 62704', '123-1-2-main-st-springfield-il-62704')).toBe('exact');
    expect(lvl('123 1/2 Main St, Springfield, IL 62704', '123 Main St, Springfield, IL 62704')).toBe('none');
    expect(lvl('123 Main St, Springfield, IL 62704', '123 1/2 Main St, Springfield, IL 62704')).toBe('none');
  });

  it('parses Wisconsin-style grid numbers', () => {
    expect(parseAddress('N1234 County Road K, Lake Geneva, WI 53147')).toMatchObject({ number: 'n1234', city: 'Lake Geneva' });
    expect(lvl('N1234 County Road K, Lake Geneva, WI 53147', 'N1234 County Rd K, Lake Geneva, WI 53147')).toBe('exact');
  });

  it('rejects the same street and city name in another state', () => {
    expect(lvl('123 Main St, Springfield, IL 62704', '123 Main St, Springfield, MO 65801')).toBe('none');
    expect(lvl('123 Main St, Springfield, IL', '123 Main St, Springfield, MO')).toBe('none');
    expect(lvl('123 Main St, Springfield, IL', '123-main-st-springfield-mo-65801')).toBe('none');
    expect(lvl('123 Main St, Springfield, IL 62704', '123 Main St, Springfield, IL 62704')).toBe('exact');
    // "or"/"in" in lowercase prose is not a state
    expect(lvl('3114 SE Lincoln St, Portland, OR 97214', '3114 SE Lincoln St Portland in spring')).not.toBe('none');
  });

  it('treats Saint and St. as the same', () => {
    expect(lvl('123 Main St, Saint Louis, MO', '123 Main St, St. Louis, MO')).toBe('exact');
  });

  it('handles unit spellings', () => {
    for (const t of ['123 Main St #4B Springfield IL 62704', '123 Main St Unit 4B, Springfield, IL', '123 Main St Apt 4B Springfield IL', '123-main-st-apt-4b-springfield-il-62704']) {
      expect(lvl('123 Main St Apt 4B, Springfield, IL 62704', t)).toBe('exact');
    }
    expect(lvl('123 Main St Apt 4B, Springfield, IL 62704', '123 Main St Apt 5C Springfield IL 62704')).toBe('none');
  });
});

describe('search failures', () => {
  const a = parseAddress('14425 American Kestrel Dr, Austin, TX 78738');
  const zillow: PortalLookup = { key: 'zillow', async run() {
    return [{ url: 'https://www.zillow.com/homedetails/70333738_zpid/', title: '', snippet: '', via: 'lookup:zillow', addressText: '14425 American Kestrel Dr Austin TX 78738' }];
  } };

  it('treats a scan as failed when every search fails, even if Zillow answered (e.g. out of credits)', async () => {
    const broke: SearchProvider = { name: 'serper', async search() { throw new Error('Not enough credits'); } };
    const r = await runScan(a, { provider: broke, lookups: [zillow] });
    expect(r.findings.map((f) => f.siteKey)).toEqual(['zillow', 'trulia']); // Trulia shares Zillow's id
    expect(scanFailed(r)).toBe(true);
  });

  it('only looks up Zillow directly (Redfin refuses server requests)', () => {
    expect(PORTAL_LOOKUPS.map((l) => l.key)).toEqual(['zillow']);
  });
});

describe('re-scans and run-to-run variance', () => {
  it('keeps a page that one re-scan happened to miss, and drops it only when it is gone or missed 3 times', async () => {
    let clock = new Date('2026-11-18T12:00:00Z');
    const page = { url: 'https://www.coldwellbankerhomes.com/tx/austin/14425-american-kestrel-dr/pid_72769822/', title: '14425 American Kestrel Dr, Austin, TX 78738', snippet: '', via: '' };
    let results: Record<string, any[]> = { general: [page] };
    let verdict: 'live' | 'unknown' | 'gone' = 'live';
    const svc = createService({
      store: memoryStore(),
      engine: () => ({ provider: fixtureProvider(results), lookups: [] }),
      now: () => clock,
      verifyGone: async () => verdict,
    });
    const { view } = await svc.scan({ address: '14425 American Kestrel Dr, Austin, TX 78738', userId: 'u', ip: '1' });
    await svc.grantPurchase({ userId: 'u', reportId: view.id, sessionId: 's', amountCents: 1999 });
    const still = async () => ((await svc.getReport({ reportId: view.id, userId: 'u' })).findings[0] as any).stillFound;
    const rescan = async () => { clock = new Date(clock.getTime() + 13 * 3600000); await svc.rescan({ userId: 'u', reportId: view.id }); };

    results = { general: [] };
    await rescan();
    expect(await still()).toBe(true); // missed by search, but the page is live
    verdict = 'unknown';
    clock = new Date(clock.getTime() + 31 * 86400000);
    await rescan();
    expect(await still()).toBe(true); // 2nd miss, no proof either way
    results = { general: [page] };
    clock = new Date(clock.getTime() + 31 * 86400000);
    await rescan();
    expect(await still()).toBe(true); // seen again: counter resets
    verdict = 'gone';
    results = { general: [] };
    clock = new Date(clock.getTime() + 31 * 86400000);
    await rescan();
    expect(await still()).toBe(false);
  });
});

describe('site names', () => {
  it('names the regional brokerages we now find often', () => {
    expect(siteFor('https://www.bhhstx.com/property/105-3777682-x')?.key).toBe('bhhs');
    expect(siteFor('https://www.windermere.com/listing/OR/Portland/x/1')?.key).toBe('windermere');
    expect(siteFor('https://ivyleaguerealtyga.lofty.me/listing-detail/1/x')?.playbook).toBe('idx_platform');
  });
});

import { htmlShowsPhotos } from '@engine/photos.ts';
import { labelPhotos, type Finding } from '@engine/engine.ts';

describe('photo check', () => {
  it('sees listing photos in og:image or a gallery, not in logos', () => {
    expect(htmlShowsPhotos('<meta property="og:image" content="https://photos.example-mls.com/123/1.jpg">')).toBe(true);
    expect(htmlShowsPhotos('<meta property="og:image" content="https://agent.com/assets/logo.png">')).toBe(false);
    const gallery = [1, 2, 3].map((i) => `<img src="https://cdn.idx.example.com/listing/9/${i}.jpg">`).join('');
    expect(htmlShowsPhotos(gallery)).toBe(true);
    expect(htmlShowsPhotos('<img src="https://cdn.example.com/listing/9/1.jpg"><img src="/img/logo.jpg">')).toBe(false);
  });

  it('labels pages: Google thumbnail = seen, fetched page decides, blocked sites unknown', async () => {
    const f = (url: string, domain: string, thumbs: string[] = [], category = 'brokerage'): Finding =>
      ({ id: url, url, canonicalUrl: url, domain, siteKey: 'x', siteName: 'x', category, media: [], title: '', snippet: '', thumbnails: thumbs, confidence: 'exact', evidence: [], foundVia: [], playbook: 'brokerage' } as Finding);
    const pad = 'x'.repeat(3000);
    const fetchFn = (async (url: string) => new Response(url.includes('withphotos')
      ? `<html>${pad}<meta property="og:image" content="https://photos.mls.example.com/a.jpg"></html>`
      : `<html>${pad}<p>3 beds 2 baths</p></html>`, { headers: { 'content-type': 'text/html' } })) as any;
    const list = [
      f('https://www.zillow.com/homedetails/1_zpid/', 'zillow.com', [], 'portal'),
      f('https://agent.com/withphotos/1', 'agent.com'),
      f('https://agent2.com/nophotos/1', 'agent2.com'),
      f('https://agent3.com/x/1', 'agent3.com', ['https://img/1.jpg']),
    ];
    await labelPhotos(list, fetchFn);
    expect(list.map((x) => x.photos)).toEqual(['unknown', 'seen', 'none', 'seen']);
  });
});

describe('priority sites', () => {
  it('counts portals, national brokerages, social and video; not small agent sites', async () => {
    const { isNamedSite } = await import('@engine/selftest.ts');
    expect(isNamedSite('https://www.trulia.com/home/1')).toBe(true);
    expect(isNamedSite('https://chadhowery.kw.com/property/1')).toBe(true);
    expect(isNamedSite('https://www.exprealty.com/x/1-main-st')).toBe(true);
    expect(isNamedSite('https://www.instagram.com/p/abc/')).toBe(true);
    expect(isNamedSite('https://ashbyre.realgeeks.com/property/1/')).toBe(false);
    expect(isNamedSite('https://thekeenangroup.com/1-main-st')).toBe(false);
  });
});

describe('search budget', () => {
  it('worst case stays at 25 searches per scan (15 first-round + 10 fill-in)', async () => {
    const { buildQueries, fillQueries } = await import('@engine/engine.ts');
    const a = parseAddress('14425 American Kestrel Dr, Austin, TX 78738');
    expect(buildQueries(a).filter((q) => !q.fallbackOnly).length).toBe(15);
    expect(fillQueries(a, []).length).toBeLessThanOrEqual(10);
    expect(fillQueries(a, []).flatMap((q) => q.sites ?? [])).toContain('kw.com');
  });

  it('photo checks give up after 7 seconds instead of holding up the scan', async () => {
    const { labelPhotos } = await import('@engine/engine.ts');
    const f = { id: '1', url: 'https://slow.example.com/1-main-st', canonicalUrl: '', domain: 'slow.example.com', siteKey: 'x', siteName: 'x', category: 'brokerage', media: [], title: '', snippet: '', thumbnails: [], confidence: 'exact', evidence: [], foundVia: [], playbook: 'brokerage' } as any;
    const never = (() => new Promise(() => {})) as any;
    const t0 = Date.now();
    await labelPhotos([f], never);
    expect(Date.now() - t0).toBeLessThan(8000);
    expect(f.photos).toBe('unknown');
  }, 10000);

  it('names the national brokerages the owner listed', () => {
    for (const [u, k] of [['https://www.onereal.com/x/1', 'real'], ['https://www.kw.com/property/1', 'kw'], ['https://www.century21.com/homes/detail/1', 'century21'], ['https://www.exprealty.com/x/1', 'exp'], ['https://www.remax.com/home-details/1', 'remax'], ['https://www.homesmart.com/x/1', 'homesmart']] as const) {
      expect(siteFor(u)?.key).toBe(k);
    }
  });
});
