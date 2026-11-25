import { describe, it, expect } from 'vitest';
import { SELFTEST_HOMES, wrongHomeSuspects, summarize, runSelftest } from '@engine/selftest.ts';
import { parseAddress } from '@engine/address.ts';

describe('accuracy goals', () => {
  it('no known-good page is flagged as another home', () => {
    for (const h of SELFTEST_HOMES) {
      const flagged = wrongHomeSuspects(parseAddress(h.address), [...h.expect, ...(h.confirmed ?? [])]);
      expect(flagged, h.address).toEqual([]);
    }
  });

  it('flags a neighbor and another unit', () => {
    expect(wrongHomeSuspects(parseAddress('1963 Hydrangea Pl, Las Vegas, NV 89106'), [
      'https://www.century21.com/homes/detail/nv/las-vegas/1964-hydrangea-pl/lid-P00800000H4Wu60EP3azy4X16wUbbVhW0ne4g57W',
    ])).toHaveLength(1);
    expect(wrongHomeSuspects(parseAddress('2727 W 43rd St #402, Minneapolis, MN 55410'), [
      'https://www.redfin.com/MN/Minneapolis/2727-W-43rd-St-55410/unit-305/home/1',
    ])).toHaveLength(1);
  });

  it('reports the three goal numbers', async () => {
    const r = await runSelftest(() => ({ provider: null, lookups: [] }), { homes: SELFTEST_HOMES.slice(0, 2) });
    expect(r.portalsExpected).toBeGreaterThan(0);
    expect(r.portalsPct).toBe(0);
    expect(r.wrongPer50).toBe(0);
    expect(summarize([]).portalsPct).toBe(0);
  });
});
