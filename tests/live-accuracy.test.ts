// Live accuracy run against the 10 real homes. Skipped unless SERPER_API_KEY is set:
//   SERPER_API_KEY=... npx vitest run tests/live-accuracy.test.ts
import { describe, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseAddress } from '@engine/address.ts';
import { runScan } from '@engine/engine.ts';
import { serperProvider } from '@engine/providers.ts';

const key = process.env.SERPER_API_KEY;
const fx = JSON.parse(readFileSync(new URL('./fixtures/accuracy-2026-11-18.json', import.meta.url), 'utf8'));

describe.skipIf(!key)('live accuracy', () => {
  it('scores hit rate on the 10 fixture homes', async () => {
    let expected = 0, hits = 0, extra = 0;
    for (const home of fx.addresses) {
      const r = await runScan(parseAddress(home.address), { provider: serperProvider(key!) });
      const got = new Set(r.findings.map((f) => f.canonicalUrl.split('?')[0]));
      const want: string[] = [home.redfin, home.zillow, ...home.other_exact].filter(Boolean);
      const found = want.filter((u) => [...got].some((g) => g.includes(new URL(u).pathname.toLowerCase().replace(/\/$/, ''))));
      expected += want.length; hits += found.length; extra += got.size - found.length;
      console.log(`${home.address}: ${found.length}/${want.length} expected, ${got.size} total, lookups=${JSON.stringify(r.diagnostics.lookups)}`);
    }
    console.log(`TOTAL ${hits}/${expected} expected pages found (${Math.round((hits / expected) * 100)}%), ${extra} additional findings to review`);
  }, 300000);
});
