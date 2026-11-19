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
    expect(r.findings).toHaveLength(1);
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
