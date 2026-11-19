import { describe, it, expect, beforeEach } from 'vitest';
import { serperProvider, simplifyQuery, _resetSerperStateForTests, type SearchQuery } from '@engine/providers.ts';

const q = (label: string, sites?: string[]): SearchQuery => ({ label, kind: 'web', phrases: ['14425 American Kestrel Dr', '14425 American Kestrel Drive'], extra: 'Austin TX 78738', sites });

describe('serper free-tier fallback', () => {
  beforeEach(() => _resetSerperStateForTests());
  it('simplifies queries step by step', () => {
    expect(simplifyQuery(q('a', ['zillow.com', 'redfin.com']), 0)).toBe('("14425 American Kestrel Dr" OR "14425 American Kestrel Drive") Austin TX 78738 (site:zillow.com OR site:redfin.com)');
    expect(simplifyQuery(q('a', ['zillow.com']), 1)).toBe('"14425 American Kestrel Dr" Austin TX 78738');
    expect(simplifyQuery(q('a'), 2)).toBe('14425 American Kestrel Dr Austin TX 78738');
    expect(simplifyQuery(q('brokerages', ['realgeeks.com']), 1)).toBe('"14425 American Kestrel Drive" Austin TX 78738 realtor listing');
    expect(simplifyQuery({ ...q('media_words'), extra: 'Austin ("virtual tour" OR photos)' }, 1)).toBe('"14425 American Kestrel Dr" Austin photos');
  });

  it('retries without operators when the account refuses them, and does not pay twice for the same text', async () => {
    const sent: string[] = [];
    const fake = async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init!.body));
      sent.push(body.q);
      if (/ OR |site:/.test(body.q)) return new Response('{"message":"Query pattern not allowed for free accounts.","statusCode":400}', { status: 400 });
      return new Response(JSON.stringify({ organic: [{ link: 'https://www.estately.com/listings/info/x', title: 't', snippet: '' }] }), { status: 200 });
    };
    const p = serperProvider('k', fake as any);
    const a = await p.search(q('general'));
    const b = await p.search(q('general2', ['zillow.com', 'redfin.com']));
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    expect(sent).toEqual([
      '("14425 American Kestrel Dr" OR "14425 American Kestrel Drive") Austin TX 78738',
      '"14425 American Kestrel Dr" Austin TX 78738',
    ]);
  });

  it('waits and retries when Serper says slow down', async () => {
    let n = 0;
    const fake = async () => (++n === 1 ? new Response('{"message":"Rate limit exceeded."}', { status: 429 }) : new Response('{"organic":[]}', { status: 200 }));
    const p = serperProvider('k', fake as any);
    expect(await p.search(q('general'))).toEqual([]);
    expect(n).toBe(2);
  });

  it('still reports other errors', async () => {
    const p = serperProvider('k', (async () => new Response('{"message":"Unauthorized."}', { status: 403 })) as any);
    await expect(p.search(q('general'))).rejects.toMatchObject({ code: 'auth' });
  });
});

describe('serper account memory', () => {
  it('skips plain-only searches once full searches are known to work, and runs them on restricted plans', async () => {
    _resetSerperStateForTests();
    const sent: string[] = [];
    const ok = async (_u: string, init?: RequestInit) => { sent.push(JSON.parse(String(init!.body)).q); return new Response('{"organic":[]}', { status: 200 }); };
    const paid = serperProvider('paid-key', ok as any);
    await paid.search(q('general'));
    await paid.search({ ...q('plain_mls'), fallbackOnly: true });
    expect(sent).toHaveLength(1);

    _resetSerperStateForTests();
    const sent2: string[] = [];
    const free = async (_u: string, init?: RequestInit) => {
      const t = JSON.parse(String(init!.body)).q; sent2.push(t);
      return / OR |site:/.test(t) ? new Response('{"message":"Query pattern not allowed for free accounts."}', { status: 400 }) : new Response('{"organic":[]}', { status: 200 });
    };
    await serperProvider('free-key', free as any).search(q('general'));
    // A later scan with the same key starts at the simpler level straight away.
    const before = sent2.length;
    await serperProvider('free-key', free as any).search(q('zip'));
    await serperProvider('free-key', free as any).search({ ...q('plain_mls'), fallbackOnly: true });
    expect(sent2.slice(before)).toEqual(['"14425 American Kestrel Drive" Austin TX 78738 listing', '"14425 American Kestrel Dr" Austin TX 78738 MLS']);
  });
});
