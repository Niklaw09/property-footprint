import { describe, it, expect } from 'vitest';
import { parseAddress } from '@engine/address.ts';
import { evaluate, listingIds, runScan } from '@engine/engine.ts';
import { renderGoogleQuery, type Candidate, type SearchQuery } from '@engine/providers.ts';

const c = (url: string, title: string, snippet = '', via = 'search:general'): Candidate => ({ url, title, snippet, via });

describe('junk from the Nov 19 run', () => {
  it('drops area pages that mention the address in passing', () => {
    const a = parseAddress('4138 E Tanglewood Dr, Phoenix, AZ 85048');
    const f = evaluate(a, [
      c('https://www.remax.com/homes-for-sale/az/phoenix/remington-trace/neighborhood/46499', 'Remington Trace homes', '4138 E Tanglewood Dr, Phoenix, AZ 85048 just listed'),
      c('https://www.exprealty.com/phoenix-az-real-estate/remington-trace-lot-110-217-tr-a-f/4138-e-tanglewood-dr', '4138 E Tanglewood Dr, Phoenix, AZ 85048'),
    ]);
    expect(f.map((x) => x.domain)).toEqual(['exprealty.com']);
  });

  it('drops points-of-interest, community and area pages on agent sites', () => {
    const atl = parseAddress('89 Montgomery St SE, Atlanta, GA 30317');
    expect(evaluate(atl, [c('https://www.realty.com/points-of-interest/ga/atlanta/food/augies_breakfast_bar_n13389061805', "Augie's", 'Near 89 Montgomery St SE, Atlanta, GA 30317')])).toHaveLength(0);
    const aus = parseAddress('6413 York Bridge Cir, Austin, TX 78749');
    expect(evaluate(aus, [
      c('http://www.ashleyaustinhomes.com/circle-c-park-place.php', 'Circle C Park Place', '6413 York Bridge Cir Austin TX 78749 sold'),
      c('https://www.austingolfcoursecommunities.com/circle-c.php?p=12', 'Circle C', '6413 York Bridge Cir, Austin, TX 78749'),
    ])).toHaveLength(0);
    const tpa = parseAddress('14732 San Marsala Ct, Tampa, FL 33626');
    expect(evaluate(tpa, [
      c('https://housestohomesflorida.com/westchase/', 'Westchase homes', '14732 San Marsala Ct, Tampa, FL 33626'),
      c('https://movewithmomentum.com/homes-on-san-marsala-court-tampa-fl', 'San Marsala Court', '14732 San Marsala Ct Tampa FL 33626'),
    ])).toHaveLength(0);
  });

  it('keeps agent pages named by an MLS number or id rather than the address', () => {
    const tpa = parseAddress('14732 San Marsala Ct, Tampa, FL 33626');
    const f = evaluate(tpa, [
      c('https://www.floridaneighborhoodrealty.com/property/TB8543033/', '14732 San Marsala Ct, Tampa, FL 33626'),
      c('https://tampaelitehomes.realgeeks.com/property/TB8543033/', '14732 San Marsala Court, Tampa, FL 33626'),
      c('https://www.terravistarealty.com/tvid-property-details.cfm?TVID=1003693144', '14732 San Marsala Ct Tampa FL 33626'),
    ]);
    expect(f).toHaveLength(3);
  });

  it('keeps a social post only when its own link or title names the home', () => {
    const tpa = parseAddress('14732 San Marsala Ct, Tampa, FL 33626');
    const f = evaluate(tpa, [
      c('https://www.facebook.com/SmithAndAssociatesRE/posts/todays-featuredhome-is-in-tampas-sunset-park-and-listed-by-the-wolfe-group/10155080095333452/', 'Smith & Associates', 'Just sold: 14732 San Marsala Ct, Tampa, FL 33626', 'search:video_social'),
      c('https://www.instagram.com/p/DdCSrdblFqG/', 'Agent on Instagram: "Just listed 14732 San Marsala Ct, Tampa FL 33626"', '', 'search:video_social'),
    ]);
    expect(f.find((x) => x.siteKey === 'facebook')).toBeUndefined(); // snippet-only: another home's post
    expect(f.find((x) => x.siteKey === 'instagram')!.confidence).toBe('exact');
  });

  it('rejects the same number on the other side of the street (W vs E Tanglewood)', () => {
    const a = parseAddress('4138 E Tanglewood Dr, Phoenix, AZ 85048');
    const f = evaluate(a, [
      c('https://www.zillow.com/homedetails/4138-W-Tanglewood-Dr-Phoenix-AZ-85048/444992159_zpid/', '4138 W Tanglewood Dr, Phoenix, AZ 85048', 'Nearby: 4138 E Tanglewood Dr, Phoenix, AZ 85048', 'search:portals'),
      c('https://www.homes.com/property/4138-e-tanglewood-dr-phoenix-az/jd5grrbgts98p/', '4138 E Tanglewood Dr, Phoenix, AZ 85048', '', 'search:portals'),
    ]);
    expect(f.map((x) => x.domain)).toEqual(['homes.com']);
  });

  it('drops zip search pages, even when the zip looks like an id', () => {
    const a = parseAddress('6413 York Bridge Cir, Austin, TX 78749');
    expect(evaluate(a, [c('https://austin.towers.net/idx/zip/78749/?idx-q-ListingStatuses=3&idx-q-PropertyTypes0=35', 'Homes in 78749', '6413 York Bridge Cir, Austin, TX 78749')])).toHaveLength(0);
    expect(evaluate(a, [c('https://agent.example.com/homes/78749/', 'Homes in 78749', '6413 York Bridge Cir, Austin, TX 78749')])).toHaveLength(0);
  });

  it('drops other units when the slug names one and the snippet has the street', () => {
    const a = parseAddress('2727 W 43rd St #402, Minneapolis, MN 55410');
    const f = evaluate(a, [c('https://www.apartments.com/2727-w-43rd-st-minneapolis-mn-unit-304/z11b66x/', 'Apartment for rent', 'Located at 2727 W 43rd St, Minneapolis, MN 55410', 'search:rentals')]);
    expect(f).toHaveLength(0);
  });
});

describe('MLS number search', () => {
  const a = parseAddress('14425 American Kestrel Dr, Austin, TX 78738');
  const first = [
    c('https://www.atproperties.com/3777682/14425-american-kestrel-dr-austin-texas-78738-unlockmls', '14425 American Kestrel Dr, Austin, TX 78738'),
    c('https://www.bhhstx.com/property/105-3777682-14425-american-kestrel-dr-austin-TX-78738', '14425 American Kestrel Dr'),
    c('https://www.zillow.com/homedetails/70333738_zpid/', '14425 American Kestrel Dr, Austin, TX 78738'),
    c('https://www.trulia.com/home/14425-american-kestrel-dr-austin-tx-78738-70333738', '14425 American Kestrel Dr, Austin, TX 78738'),
  ];

  it('finds the MLS number shared by two unrelated sites, not Zillow ids', () => {
    expect(listingIds(evaluate(a, first))).toEqual(['3777682']);
  });

  it('runs fill-in searches only for the national sites the first round missed', async () => {
    const seen: SearchQuery[] = [];
    const provider = {
      name: 'fake',
      async search(q: SearchQuery) {
        seen.push(q);
        if (q.label === 'general') return [...first, c('https://www.realtor.com/realestateandhomes-detail/14425-American-Kestrel-Dr_Austin_TX_78738_M87848-30096', '14425 American Kestrel Dr, Austin, TX 78738')];
        if (q.label === 'fill' && q.sites?.includes('homes.com')) return [c('https://www.homes.com/property/14425-american-kestrel-dr-austin-tx/k95kj5zh9w15e/', '14425 American Kestrel Dr, Austin, TX 78738', '', 'search:fill')];
        return [];
      },
    };
    const r = await runScan(a, { provider, lookups: [] });
    const fills = seen.filter((q) => q.label === 'fill');
    expect(fills.length).toBeGreaterThan(0);
    expect(fills.length).toBeLessThanOrEqual(10);
    expect(fills.every((q) => (q.sites ?? []).length <= 3)).toBe(true);
    const asked = fills.flatMap((q) => q.sites ?? []);
    expect(asked).not.toContain('realtor.com'); // already found
    expect(asked).not.toContain('trulia.com'); // already found
    expect(asked).toContain('homes.com');
    expect(asked).toContain('har.com'); // Texas home
    expect(r.findings.map((f) => f.domain)).toContain('homes.com');
  });

  it('renders an exclusion search', () => {
    expect(renderGoogleQuery({ label: 'x', kind: 'web', phrases: ['1 Main St'], extra: 'Austin TX', exclude: ['zillow.com', 'redfin.com'] }))
      .toBe('"1 Main St" Austin TX -site:zillow.com -site:redfin.com');
  });
});
