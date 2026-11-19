import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseAddress } from '@engine/address.ts';
import { evaluate, runScan, buildQueries, scanFailed } from '@engine/engine.ts';
import { fixtureProvider, renderGoogleQuery, type Candidate, type PortalLookup } from '@engine/providers.ts';

const fx = JSON.parse(readFileSync(new URL('./fixtures/accuracy-2026-11-18.json', import.meta.url), 'utf8'));

describe('accuracy fixtures (10 real addresses, Nov 2026)', () => {
  for (const home of fx.addresses) {
    it(home.address, () => {
      const a = parseAddress(home.address);
      const good: Candidate[] = [
        ...(home.redfin ? [{ url: home.redfin, title: '', snippet: '', via: 'search:portals' }] : []),
        ...home.other_exact.map((url: string) => ({ url, title: '', snippet: '', via: 'search:general' })),
      ];
      // Search snippets usually carry the address even when the slug does not (e.g. realgeeks /property/123/)
      for (const g of good) g.title = `${home.address} | Listing`;
      const bad: Candidate[] = [
        { url: `https://google.com/maps/search/${encodeURIComponent(home.address)}`, title: home.address, snippet: '', via: 'search:general' },
        { url: 'https://app3.doe.k12.ga.us/ows-bin/owa/fte_pack_site.entry_form', title: home.address, snippet: '', via: 'search:general' },
        { url: 'https://www.ownerly.com/x', title: home.address, snippet: '', via: 'search:general' },
        { url: 'https://www.trulia.com/home/4996-n-malaya-st-denver-co-80249-131664015', title: '4996 N Malaya St, Denver, CO 80249', snippet: `Near ${home.address}`, via: 'search:portals' },
        { url: `https://www.zillow.com/${a.city.toLowerCase()}-${a.state.toLowerCase()}/`, title: `Homes for sale in ${a.city}`, snippet: home.address, via: 'search:portals' },
      ];
      const rejected: Record<string, number> = {};
      const findings = evaluate(a, [...good, ...bad], rejected);
      const urls = findings.map((f) => f.url);
      for (const g of good) expect(urls, `missed ${g.url}`).toContain(g.url);
      for (const b of bad) expect(urls, `false positive ${b.url}`).not.toContain(b.url);
      expect(findings.every((f) => f.confidence === 'exact')).toBe(true);
    });
  }

  it('rejects other units in the Minneapolis building', () => {
    const a = parseAddress('2727 W 43rd St #402, Minneapolis, MN 55410');
    const f = evaluate(a, [
      { url: 'https://www.redfin.com/MN/Minneapolis/2727-W-43rd-St-55410/unit-408/home/1', title: '2727 W 43rd St #408', snippet: '', via: 'search:portals' },
      { url: 'https://www.redfin.com/MN/Minneapolis/2727-W-43rd-St-55410/unit-409/home/2', title: '2727 W 43rd St #409', snippet: '', via: 'search:portals' },
      { url: 'https://www.redfin.com/MN/Minneapolis/2727-W-43rd-St-55410/unit-402/home/49888403', title: '2727 W 43rd St #402', snippet: '', via: 'search:portals' },
    ]);
    expect(f.map((x) => x.url)).toEqual(['https://www.redfin.com/MN/Minneapolis/2727-W-43rd-St-55410/unit-402/home/49888403']);
  });
});

describe('runScan', () => {
  const a = parseAddress('89 Montgomery St SE, Atlanta, GA 30317');
  const zillow: PortalLookup = {
    key: 'zillow',
    async run(line) {
      // Mimic Zillow: only answers when the trailing directional is dropped
      if (/ SE /.test(line)) return [];
      return [{ url: 'https://www.zillow.com/homedetails/14467422_zpid/', title: '89 Montgomery St Atlanta, GA 30317', snippet: '', via: 'lookup:zillow', addressText: '89 Montgomery St Atlanta GA 30317' }];
    },
  };
  const broken: PortalLookup = { key: 'redfin', async run() { throw new Error('blocked'); } };

  it('combines lookups and search, retries without trailing directional, survives a failed lookup', async () => {
    const provider = fixtureProvider({
      general: [{ url: 'https://homesbymarco.com/properties/89-montgomery-st-atlanta-ga-30317/1436273', title: '', snippet: '', via: '' }],
      portals: [{ url: 'https://www.trulia.com/home/89-montgomery-st-se-atlanta-ga-30317-14467422', title: '89 Montgomery St SE', snippet: '', via: '' }],
      tours: [{ url: 'https://my.matterport.com/show/?m=abc123XYZ', title: '89 Montgomery St SE - Atlanta', snippet: 'Explore this 3D space', via: '' }],
    });
    const r = await runScan(a, { provider, lookups: [zillow, broken] });
    const keys = r.findings.map((f) => f.siteKey);
    expect(keys).toEqual(expect.arrayContaining(['zillow', 'trulia', 'matterport', 'web:homesbymarco.com']));
    expect(r.findings.find((f) => f.siteKey === 'trulia')?.coveredBy).toBe('zillow');
    expect(r.findings.find((f) => f.siteKey === 'matterport')?.media).toContain('tour');
    expect(r.diagnostics.lookups.find((l) => l.key === 'redfin')?.ok).toBe(false);
    expect(r.checks.map((c) => c.siteKey)).not.toContain('zillow');
    expect(r.checks.map((c) => c.siteKey)).toContain('redfin');
    expect(scanFailed(r)).toBe(false);
  });

  it('reports failure instead of "nothing found" when every source fails', async () => {
    const bad = { name: 'x', async search() { throw new Error('down'); } };
    const r = await runScan(a, { provider: bad, lookups: [broken] });
    expect(scanFailed(r)).toBe(true);
  });

  it('builds compact Google queries', () => {
    const q = buildQueries(a).find((x) => x.label === 'portals')!;
    expect(renderGoogleQuery(q)).toBe('("89 Montgomery St SE" OR "89 Montgomery Street Southeast" OR "89 Montgomery St") Atlanta (site:zillow.com OR site:redfin.com OR site:realtor.com OR site:trulia.com OR site:homes.com OR site:movoto.com OR site:estately.com)');
    expect(buildQueries(a).filter((x) => !x.fallbackOnly).length).toBeLessThanOrEqual(15); // full-operator plans; up to 10 fill-in searches come on top
    expect(buildQueries(a).length).toBeLessThanOrEqual(19);
  });
});

import { runSelftest, SELFTEST_HOMES } from '@engine/selftest.ts';
describe('selftest', () => {
  it('scores known pages, matching Zillow by zpid', async () => {
    const z: PortalLookup = { key: 'zillow', async run(line) {
      if (!line.startsWith('14425')) return [];
      return [{ url: 'https://www.zillow.com/homedetails/70333738_zpid/', title: '', snippet: '', via: 'lookup:zillow', addressText: '14425 American Kestrel Dr Austin TX 78738' }];
    } };
    const r = await runSelftest(() => ({ provider: fixtureProvider({}), lookups: [z] }));
    expect(r.rows).toHaveLength(SELFTEST_HOMES.length);
    // Zillow, plus the Trulia page built from Zillow's id
    expect(r.rows.find((x) => x.address.startsWith('14425'))!.found).toBe(2);
    expect(r.found).toBe(2);
    expect(r.origFound).toBeGreaterThanOrEqual(1);
    expect(r.expected).toBeGreaterThan(r.origExpected); // confirmed pages count toward the headline
  });
});
