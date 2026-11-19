// Built-in accuracy self-test: scans the 10 real homes from the Nov 2026 test and reports how many known pages were found.
import { parseAddress } from './address.ts';
import { runScan, type EngineOptions } from './engine.ts';

export const SELFTEST_HOMES: { address: string; expect: string[] }[] = [
  {
    "address": "14425 American Kestrel Dr, Austin, TX 78738",
    "expect": [
      "https://www.redfin.com/TX/Austin/14425-American-Kestrel-Dr-78738/home/30962292",
      "https://www.zillow.com/homedetails/70333738_zpid/",
      "https://www.estately.com/listings/info/14425-american-kestrel-dr-austin-tx-78738--2",
      "https://har.com/homedetail/14425-american-kestrel-dr-austin-tx-78738/6791779",
      "https://thekeenangroup.com/14425-american-kestrel-dr-austin-tx-78738",
      "https://www.spyglassrealty.com/listing/5322164-14425-american-kestrel-drive-austin-tx-78738",
      "https://ashbyre.realgeeks.com/property/3777682/",
      "https://robertjfischer.realgeeks.com/property/3777682/",
      "https://www.houzeo.com/homes/14425-american-kestrel-dr-austin-tx-78738/hzid_6394d63e",
      "https://neuhausre.com/properties/austin/14425-american-kestrel-dr-01257001460000"
    ]
  },
  {
    "address": "6413 York Bridge Cir, Austin, TX 78749",
    "expect": [
      "https://www.redfin.com/TX/Austin/6413-York-Bridge-Cir-78749/home/30983684",
      "https://www.zillow.com/homedetails/70334856_zpid/",
      "https://neuhausre.com/properties/austin/6413-york-bridge-cir-04203601100000/",
      "https://atproperties.com/4191638/6413-york-bridge-cir-austin-texas-78749-unlockmls"
    ]
  },
  {
    "address": "4138 E Tanglewood Dr, Phoenix, AZ 85048",
    "expect": [
      "https://www.redfin.com/AZ/Phoenix/4138-E-Tanglewood-Dr-85048/home/26878510",
      "https://www.zillow.com/homedetails/4138-E-Tanglewood-Dr-Phoenix-AZ-85048/8259511_zpid/",
      "https://valleygroupaz.realgeeks.com/property/7068179/"
    ]
  },
  {
    "address": "9828 Starwood Dr, Charlotte, NC 28215",
    "expect": [
      "https://www.redfin.com/NC/Charlotte/9828-Starwood-Dr-28215/home/43616099",
      "https://www.zillow.com/homedetails/5654448_zpid/",
      "https://www.johnkurtzhomes.com/listings/9828-starwood-drive-charlotte-243901778",
      "https://gnzrealty.com/home/9828-starwood-dr-charlotte-nc-28215-9e656b44"
    ]
  },
  {
    "address": "5062 Perth St, Denver, CO 80249",
    "expect": [
      "https://www.redfin.com/CO/Denver/5062-Perth-St-80249/home/34007201",
      "https://www.zillow.com/homedetails/61469624_zpid/",
      "https://austinhartley.realgeeks.com/property/6283032/",
      "https://perfecthouseforyou.realgeeks.com/property/6283032/"
    ]
  },
  {
    "address": "14732 San Marsala Ct, Tampa, FL 33626",
    "expect": [
      "https://www.redfin.com/FL/Tampa/14732-San-Marsala-Ct-33626/home/46976101",
      "https://www.zillow.com/homedetails/14732-San-Marsala-Ct-Tampa-FL-33626/66717357_zpid/",
      "https://tampaelitehomes.realgeeks.com/property/TB8543033/",
      "https://bosshardtrealty.clone.unionstmedia.com/listing/TB8543033/14732-san-marsala-court-tampa-fl-33626/",
      "https://www.floridaneighborhoodrealty.com/property/TB8543033/",
      "https://www.beycome.com/14732-SAN-MARSALA-COURT/STELTB8543033",
      "https://bexrealty.com/FL/Tampa/14732-san-marsala-court/home/MFRTB8543033"
    ]
  },
  {
    "address": "312 Parmley Ln, Nashville, TN 37207",
    "expect": [
      "https://www.redfin.com/TN/Nashville/312-Parmley-Ln-37207/home/60679611",
      "https://www.zillow.com/homedetails/121390342_zpid/",
      "https://www.vrmproperties.com/Property-For-Sale/28501/312-parmley-ln-nashville-tn-37207",
      "https://granthammond.com/idx/mls-3602048-312_parmley_ln_nashville_tn_37207"
    ]
  },
  {
    "address": "3114 SE Lincoln St, Portland, OR 97214",
    "expect": [
      "https://www.redfin.com/OR/Portland/3114-SE-Lincoln-St-97214/home/25772877",
      "https://www.zillow.com/homedetails/3114-SE-Lincoln-St-Portland-OR-97214/53958423_zpid/",
      "https://www.coldwellbankerhomes.com/or/portland/3114-se-lincoln-st/pid_72815754/"
    ]
  },
  {
    "address": "89 Montgomery St SE, Atlanta, GA 30317",
    "expect": [
      "https://www.redfin.com/GA/Atlanta/89-Montgomery-St-SE-30317/home/23692603",
      "https://homesbymarco.com/properties/89-montgomery-st-atlanta-ga-30317/1436273"
    ]
  },
  {
    "address": "2727 W 43rd St #402, Minneapolis, MN 55410",
    "expect": [
      "https://www.redfin.com/MN/Minneapolis/2727-W-43rd-St-55410/unit-402/home/49888403",
      "https://www.zillow.com/homedetails/445846157_zpid/"
    ]
  }
];

function pathKey(u: string): string {
  try {
    const x = new URL(u);
    return (x.hostname.replace(/^www\./, '') + x.pathname).toLowerCase().replace(/\/$/, '');
  } catch {
    return u;
  }
}

export interface SelftestRow {
  address: string;
  expected: number;
  found: number;
  missed: string[];
  total: number;
  lookups: { key: string; ok: boolean; found: number; error?: string }[];
  queryErrors: number;
  /** First search error, e.g. "auth: HTTP 403 Unauthorized", to diagnose failed searches. */
  firstError?: string;
  /** Results that aren't in the known list, as "confidence | found via | url", to spot junk or new real pages. */
  extras: string[];
  ms: number;
}

export async function runSelftest(engine: () => EngineOptions, concurrency = 3): Promise<{ rows: SelftestRow[]; expected: number; found: number; pct: number }> {
  const rows: SelftestRow[] = [];
  const queue = [...SELFTEST_HOMES];
  const worker = async () => {
    for (let h = queue.shift(); h; h = queue.shift()) {
      const r = await runScan(parseAddress(h.address), engine());
      const got = r.findings.map((f) => pathKey(f.url));
      const zpidGot = r.findings.filter((f) => f.siteKey === 'zillow').map((f) => f.url.match(/(\d+)_zpid/)?.[1]);
      const hit = (u: string) => {
        const z = u.match(/(\d+)_zpid/)?.[1];
        if (z) return zpidGot.includes(z);
        return got.includes(pathKey(u));
      };
      const missed = h.expect.filter((u) => !hit(u));
      const known = new Set(h.expect.map(pathKey));
      const knownZ = new Set(h.expect.map((u) => u.match(/(\d+)_zpid/)?.[1]).filter(Boolean));
      const extras = r.findings
        .filter((f) => !known.has(pathKey(f.url)) && !knownZ.has(f.url.match(/(\d+)_zpid/)?.[1]))
        .map((f) => `${f.confidence} | ${f.foundVia?.[0] ?? ''} | ${f.url}`)
        .slice(0, 60);
      rows.push({
        address: h.address, expected: h.expect.length, found: h.expect.length - missed.length, missed, total: r.findings.length,
        extras, lookups: r.diagnostics.lookups, queryErrors: r.diagnostics.queryErrors.length, ms: r.diagnostics.durationMs,
        firstError: r.diagnostics.queryErrors[0] ? `${r.diagnostics.queryErrors[0].code}: ${r.diagnostics.queryErrors[0].detail ?? ''}`.trim() : undefined,
      });
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  rows.sort((a, b) => a.address.localeCompare(b.address));
  const expected = rows.reduce((s, r) => s + r.expected, 0);
  const found = rows.reduce((s, r) => s + r.found, 0);
  return { rows, expected, found, pct: expected ? Math.round((found / expected) * 100) : 0 };
}
