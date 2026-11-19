import { describe, it, expect } from 'vitest';
import { parseAddress } from '@engine/address.ts';
import { evaluate, fillQueries, otherUnitInSlug, retryQueries, runScan, siblingCandidates } from '@engine/engine.ts';
import { fixtureProvider, type Candidate } from '@engine/providers.ts';
import { siteFor } from '@engine/sites.ts';

const c = (url: string, title: string, snippet = '', via = 'search:general'): Candidate => ({ url, title, snippet, via });

describe('sister-site pages (Nov 19 research)', () => {
  it('builds the Trulia page from Zillow’s id (Trulia’s home id is the zpid)', () => {
    const a = parseAddress('312 Parmley Ln, Nashville, TN 37207');
    const z = evaluate(a, [{ url: 'https://www.zillow.com/homedetails/121390342_zpid/', title: '', snippet: '', via: 'lookup:zillow', addressText: '312 Parmley Ln Nashville TN 37207' }]);
    const f = evaluate(a, siblingCandidates(a, z));
    expect(f.map((x) => x.url)).toEqual(['https://www.trulia.com/home/312-parmley-ln-nashville-tn-37207-121390342']);
    expect(f[0].confidence).toBe('exact');
    expect(f[0].evidence).toContain('same_listing_id');
  });

  it('drops a trailing direction in the Trulia address, as Trulia does', () => {
    const a = parseAddress('89 Montgomery St SE, Atlanta, GA 30317');
    const z = evaluate(a, [c('https://www.zillow.com/homedetails/89-Montgomery-St-Atlanta-GA-30317/14467422_zpid/', '89 Montgomery St SE, Atlanta, GA 30317')]);
    expect(siblingCandidates(a, z).map((x) => x.url)).toContain('https://www.trulia.com/home/89-montgomery-st-atlanta-ga-30317-14467422');
  });

  it('builds no Trulia page for a condo unit (its unit format is not known)', () => {
    const a = parseAddress('2727 W 43rd St #402, Minneapolis, MN 55410');
    const z = evaluate(a, [{ url: 'https://www.zillow.com/homedetails/71816686_zpid/', title: '', snippet: '', via: 'lookup:zillow', addressText: '2727 W 43rd St # 402 Minneapolis MN 55410' }]);
    expect(siblingCandidates(a, z)).toHaveLength(0);
  });

  it('shares an Anywhere listing id across Century 21, ERA, BHGRE and Coldwell Banker, as possible matches', () => {
    const a = parseAddress('6413 York Bridge Cir, Austin, TX 78749');
    const lid = 'lid-P00800000HG2LeoTB2cavrFQMQyVeDhwFwPh6Qo2';
    const found = evaluate(a, [c(`https://www.era.com/property/detail/tx/austin/6413-york-bridge-cir/${lid}`, '6413 York Bridge Cir, Austin, TX 78749')]);
    const all = evaluate(a, [c(`https://www.era.com/property/detail/tx/austin/6413-york-bridge-cir/${lid}`, '6413 York Bridge Cir, Austin, TX 78749'), ...siblingCandidates(a, found)]);
    const byDomain = Object.fromEntries(all.map((f) => [f.domain, f]));
    expect(Object.keys(byDomain).sort()).toEqual(['bhgre.com', 'century21.com', 'coldwellbanker.com', 'era.com']);
    expect(byDomain['era.com'].confidence).toBe('exact'); // seen in search
    expect(byDomain['century21.com'].url).toBe(`https://www.century21.com/homes/detail/tx/austin/6413-york-bridge-cir/${lid}`);
    expect(byDomain['century21.com'].confidence).toBe('likely'); // built from the id only
    expect(byDomain['coldwellbanker.com'].siteKey).toBe('coldwellbanker');
  });

  it('turns a HomeFinder page into the Realtor.com page with the same property id', () => {
    const a = parseAddress('89 Montgomery St SE, Atlanta, GA 30317');
    const hf = evaluate(a, [c('https://homefinder.com/realestateandhomes-detail/89-Montgomery-St-SE_Atlanta_GA_30317_M65665-52772', '89 Montgomery St SE, Atlanta, GA 30317')]);
    expect(hf[0].siteKey).toBe('homefinder');
    expect(siblingCandidates(a, hf).map((x) => x.url)).toEqual(['https://www.realtor.com/realestateandhomes-detail/89-Montgomery-St-SE_Atlanta_GA_30317_M65665-52772']);
  });

  it('a full scan adds the sister pages and skips the Trulia fill-in search', async () => {
    const a = parseAddress('312 Parmley Ln, Nashville, TN 37207');
    const zillow = { key: 'zillow', async run() { return [{ url: 'https://www.zillow.com/homedetails/121390342_zpid/', title: '', snippet: '', via: 'lookup:zillow', addressText: '312 Parmley Ln Nashville TN 37207' }]; } };
    const asked: string[] = [];
    const provider = { name: 'fake', async search(q: any) { if (q.label === 'fill') asked.push(...(q.sites ?? [])); return []; } };
    const r = await runScan(a, { provider, lookups: [zillow] });
    expect(r.findings.map((f) => f.siteKey)).toContain('trulia');
    expect(asked).not.toContain('trulia.com');
  });
});

describe('condo units and building pages', () => {
  const a = parseAddress('2727 W 43rd St #402, Minneapolis, MN 55410');

  it('spots another unit number in front of the house number', () => {
    expect(otherUnitInSlug(a, 'https://www.exprealty.com/minneapolis-mn-real-estate/cic-1473-condos-at-lake-harriet-ii/103-2727-w-43rd-st')).toBe(true);
    expect(otherUnitInSlug(a, 'https://www.exprealty.com/minneapolis-mn-real-estate/409-2727-w-43rd-st')).toBe(true);
    expect(otherUnitInSlug(a, 'https://www.exprealty.com/minneapolis-mn-real-estate/402-2727-w-43rd-st')).toBe(false);
    expect(otherUnitInSlug(a, 'https://www.movoto.com/minneapolis-mn/2727-w-43rd-st-402-minneapolis-mn-55410/pid_awjggg2jgh/')).toBe(false);
  });

  it('drops other units and rental building pages from a condo scan', () => {
    const f = evaluate(a, [
      c('https://www.exprealty.com/minneapolis-mn-real-estate/cic-1473-condos-at-lake-harriet-ii/412-2727-w-43rd-st', '2727 W 43rd St, Minneapolis, MN 55410'),
      c('https://www.apartmentfinder.com/Minnesota/Minneapolis-Apartments/2727-W-43Rd-St-Apartments-7eqwg5w', '2727 W 43rd St Apartments, Minneapolis, MN 55410'),
      c('https://www.realtor.com/realestateandhomes-detail/2727-W-43rd-St-Apt-402_Minneapolis_MN_55410_M78814-86194', '2727 W 43rd St Apt 402, Minneapolis, MN 55410'),
    ]);
    expect(f.map((x) => x.domain)).toEqual(['realtor.com']);
  });

  it('adds the unit number to fill-in searches for a condo', () => {
    expect(fillQueries(a, [])[0].extra).toBe('Minneapolis 402');
  });
});

describe('social junk', () => {
  it('drops a Marketplace item and posts whose only match is the snippet', () => {
    const a = parseAddress('4138 E Tanglewood Dr, Phoenix, AZ 85048');
    const f = evaluate(a, [
      c('https://www.facebook.com/marketplace/item/4515964635284597/', 'Marketplace - House for rent', '4138 E Tanglewood Dr Phoenix AZ 85048', 'search:social'),
      c('https://www.instagram.com/p/DdCSrdblFqG/', 'Phoenix Homes on Instagram', 'Open house this weekend! ... 4138 E Tanglewood Dr, Phoenix, AZ 85048', 'search:social'),
    ]);
    expect(f).toHaveLength(0);
  });

  it('keeps a post whose own link names the home', () => {
    const a = parseAddress('5062 Perth St, Denver, CO 80249');
    const f = evaluate(a, [c('https://www.facebook.com/kathi.farrellweaver/posts/j-u-s-t-l-i-s-t-e-d5062-perth-street-denver-co-802494-beds-3-baths-1942-sf-450kt/10235918946977179/', 'Kathi Farrell Weaver', '', 'search:social')]);
    expect(f).toHaveLength(1);
  });
});

describe('fill-in searches', () => {
  it('asks for 2 sites per search for the top sites, then 3, at most 10 searches, 20 results each', () => {
    const a = parseAddress('14425 American Kestrel Dr, Austin, TX 78738');
    const qs = fillQueries(a, []);
    expect(qs.length).toBe(10);
    expect(qs.slice(0, 6).every((q) => q.sites!.length === 2)).toBe(true);
    expect(qs.slice(6).every((q) => q.sites!.length === 3)).toBe(true);
    expect(qs.every((q) => q.num === 20)).toBe(true);
    expect(qs[0].sites).toEqual(['realtor.com', 'homes.com']);
  });

  it('recognises Coldwell Banker’s lid pages and Windermere agent sites', () => {
    expect(siteFor('https://www.coldwellbanker.com/co/denver/5062-perth-st/lid-P00800000GsvhiAqJVBvkoVzm1ayGVEK0VVOavQk')?.key).toBe('coldwellbanker');
    expect(siteFor('https://billygrippo.withwre.com/listing/OR/Portland/3014-SE-Lincoln-St-97214/32983307')?.key).toBe('windermere');
  });
});

void fixtureProvider;

describe('photo labels', () => {
  it('counts an image result on another link to the same listing as photos seen', async () => {
    const { labelPhotos } = await import('@engine/engine.ts');
    const a = parseAddress('14425 American Kestrel Dr, Austin, TX 78738');
    const f = evaluate(a, [
      { url: 'https://www.zillow.com/homedetails/70333738_zpid/', title: '', snippet: '', via: 'lookup:zillow', addressText: '14425 American Kestrel Dr Austin TX 78738' },
      { url: 'https://www.zillow.com/homedetails/14425-American-Kestrel-Dr-Austin-TX-78738/70333738_zpid/', title: '14425 American Kestrel Dr, Austin, TX 78738', snippet: '', via: 'images:images_portals', thumbnail: 'https://photos.zillowstatic.com/fp/x.jpg' },
      c('https://www.homes.com/property/14425-american-kestrel-dr-austin-tx/k95kj5zh9w15e/', '14425 American Kestrel Dr, Austin, TX 78738'),
    ]);
    await labelPhotos(f, null);
    expect(f.filter((x) => x.siteKey === 'zillow').every((x) => x.photos === 'seen')).toBe(true);
    expect(f.find((x) => x.siteKey === 'homes')!.photos).toBe('unknown');
  });
});

describe('Nov 19 late-run fixes', () => {
  it('retries the biggest missing sites one at a time, worded differently, and counts either Coldwell Banker site', () => {
    const a = parseAddress('5062 Perth St, Denver, CO 80249');
    const found = evaluate(a, [c('https://www.coldwellbanker.com/co/denver/5062-perth-st/lid-P00800000HFKNtGGaC1zyHdv3dqu1FTjF1CnD61Y', '5062 Perth St, Denver, CO 80249')]);
    const qs = retryQueries(a, found);
    expect(qs.map((q) => q.sites![0])).toEqual(['realtor.com', 'homes.com', 'redfin.com', 'century21.com', 'bhhs.com', 'compass.com']);
    expect(qs[0].phrases).toEqual(['5062 Perth Street']);
    expect(qs[0].extra).toBe('80249');
  });

  it('builds the HomeFinder page from Realtor.com as a possible match', () => {
    const a = parseAddress('89 Montgomery St SE, Atlanta, GA 30317');
    const r = c('https://www.realtor.com/realestateandhomes-detail/89-Montgomery-St-SE_Atlanta_GA_30317_M65665-52772', '89 Montgomery St SE, Atlanta, GA 30317');
    const f = evaluate(a, [r, ...siblingCandidates(a, evaluate(a, [r]))]);
    const hf = f.find((x) => x.siteKey === 'homefinder')!;
    expect(hf.url).toBe('https://www.homefinder.com/realestateandhomes-detail/89-Montgomery-St-SE_Atlanta_GA_30317_M65665-52772');
    expect(hf.confidence).toBe('likely');
  });

  it('reads a ZIP glued to the next word in a Facebook link', () => {
    const a = parseAddress('14732 San Marsala Ct, Tampa, FL 33626');
    const f = evaluate(a, [c('https://www.facebook.com/amanda.siftar/posts/sold-in-waterchase-14732-san-marsala-court-33626some-transactions-are-a-pleasure/10235755789937205/', 'Amanda Siftar', '', 'search:social')]);
    expect(f).toHaveLength(1);
  });

  it('shares photo labels across sister sites with the same listing id', async () => {
    const { labelPhotos } = await import('@engine/engine.ts');
    const a = parseAddress('5062 Perth St, Denver, CO 80249');
    const lid = 'lid-P00800000HFKNtGGaC1zyHdv3dqu1FTjF1CnD61Y';
    const f = evaluate(a, [
      { ...c(`https://www.coldwellbanker.com/co/denver/5062-perth-st/${lid}`, '5062 Perth St, Denver, CO 80249'), thumbnail: 'https://img.example/1.jpg' },
      c(`https://www.century21.com/homes/detail/co/denver/5062-perth-st/${lid}`, '5062 Perth St, Denver, CO 80249'),
    ]);
    await labelPhotos(f, null);
    expect(f.every((x) => x.photos === 'seen')).toBe(true);
  });

  it('scores big sites once per site, counting either Coldwell Banker site', async () => {
    const { siteCoverage } = await import('@engine/selftest.ts');
    const r = siteCoverage(
      ['https://www.coldwellbankerhomes.com/co/denver/5062-perth-st/pid_72945706/', 'https://www.zillow.com/homedetails/61469624_zpid/', 'https://www.corcoran.com/listing/for-sale/5062-perth-street-denver-co-80249/109321660/regionId/109'],
      ['coldwellbanker', 'zillow', 'zillow'],
    );
    expect(r).toEqual({ sitesExpected: 3, sitesFound: 2, sitesMissed: ['corcoran'] });
  });
});
