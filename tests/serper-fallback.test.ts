import { describe, it, expect } from 'vitest';
import { serperProvider, simplifyQuery, type SearchQuery } from '@engine/providers.ts';

const q = (label: string, sites?: string[]): SearchQuery => ({ label, kind: 'web', phrases: ['14425 American Kestrel Dr', '14425 American Kestrel Drive'], extra: 'Austin TX 78738', sites });

describe('serper free-tier fallback', () => {
  it('simplifies queries step by step', () => {
    expect(simplifyQuery(q('a', ['zillow.com', 'redfin.com']), 0)).toBe('("14425 American Kestrel Dr" OR "14425 American Kestrel Drive") Austin TX 78738 (site:zillow.com OR site:redfin.com)');
    expect(simplifyQuery(q('a', ['zillow.com']), 1)).toBe('"14425 American Kestrel Dr" Austin TX 78738');
    expect(simplifyQuery(q('a'), 2)).toBe('14425 American Kestrel Dr Austin TX 78738');
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
    const b = await p.search(q('portals', ['zillow.com', 'redfin.com']));
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    expect(sent).toEqual([
      '("14425 American Kestrel Dr" OR "14425 American Kestrel Drive") Austin TX 78738',
      '"14425 American Kestrel Dr" Austin TX 78738',
    ]);
  });

  it('still reports other errors', async () => {
    const p = serperProvider('k', (async () => new Response('{"message":"Unauthorized."}', { status: 403 })) as any);
    await expect(p.search(q('general'))).rejects.toMatchObject({ code: 'auth' });
  });
});
