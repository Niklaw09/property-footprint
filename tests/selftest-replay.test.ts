import { describe, it, expect } from 'vitest';
import { SELFTEST_HOMES, runSelftest, replayEngine, summarize } from '@engine/selftest.ts';
import type { SearchProvider } from '@engine/providers.ts';

describe('accuracy check: 20 homes, recorded and replayable', () => {
  it('has 20 distinct homes, 10 in each set, every page a valid URL', () => {
    expect(SELFTEST_HOMES).toHaveLength(20);
    expect(new Set(SELFTEST_HOMES.map((h) => h.address)).size).toBe(20);
    expect(SELFTEST_HOMES.filter((h) => (h.set ?? 'A') === 'B')).toHaveLength(10);
    for (const h of SELFTEST_HOMES) for (const u of [...h.expect, ...(h.confirmed ?? [])]) expect(() => new URL(u)).not.toThrow();
  });

  it('a recorded run replays to the same result with no live searches', async () => {
    const homes = SELFTEST_HOMES.slice(10, 13);
    // A fake search that returns each home's known pages, titled with the address.
    const live: SearchProvider = {
      name: 'fake',
      async search(q) {
        const h = homes.find((x) => q.phrases.some((p) => x.address.toLowerCase().includes(p.toLowerCase().split(' ').slice(0, 2).join(' '))));
        return (h?.confirmed ?? []).slice(0, 3).map((url) => ({ url, title: h!.address, snippet: '', via: `search:${q.label}` }));
      },
    };
    const first = await runSelftest(() => ({ provider: live, lookups: [] }), { homes, record: true });
    expect(first.found).toBeGreaterThan(0);
    expect(first.raw).toHaveLength(3);
    expect(first.raw![0].searches.length).toBeGreaterThan(5);
    const replayed = [];
    for (const raw of first.raw!) {
      const h = homes.filter((x) => x.address === raw.address);
      const eng = replayEngine(raw);
      replayed.push(...(await runSelftest(() => eng, { homes: h })).rows);
      expect(eng.misses).toEqual([]);
    }
    const again = summarize(replayed);
    expect(again.found).toBe(first.found);
    expect(again.sitesFound).toBe(first.sitesFound);
    expect(again.rows.map((r) => r.total)).toEqual(first.rows.map((r) => r.total));
  });

  it('keeps the first-10 comparison separate', () => {
    const r = summarize([]);
    expect(r.setA).toEqual({ sitesExpected: 0, sitesFound: 0, sitesPct: 0, namedPct: 0 });
  });
});
