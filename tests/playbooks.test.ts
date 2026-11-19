import { describe, it, expect } from 'vitest';
import { PLAYBOOKS, ALWAYS } from '@engine/playbooks.ts';
import { SITES } from '@engine/sites.ts';
import { buildLetter } from '@engine/letters.ts';

describe('playbooks', () => {
  it('covers every site in the registry', () => {
    for (const s of SITES) expect(PLAYBOOKS[s.playbook], s.key).toBeDefined();
    for (const k of ALWAYS) expect(PLAYBOOKS[k]).toBeDefined();
  });
  it('has at least 30 playbooks', () => expect(Object.keys(PLAYBOOKS).length).toBeGreaterThanOrEqual(30));
  it('every step and outcome is translated, links are https', () => {
    for (const p of Object.values(PLAYBOOKS)) {
      expect(p.outcome.en && p.outcome.es, p.key).toBeTruthy();
      for (const s of p.steps) {
        expect(s.en && s.es, p.key).toBeTruthy();
        if (s.link) expect(s.link.url.startsWith('https://'), s.link.url).toBe(true);
      }
    }
  });
  it('letters render in both languages for every kind used', () => {
    const kinds = new Set(Object.values(PLAYBOOKS).flatMap((p) => p.letters));
    for (const k of kinds) for (const lang of ['en', 'es'] as const) {
      const l = buildLetter(k, { lang, ownerName: 'Ana', address: '1 Main St, Austin, TX 78701', siteName: 'Zillow', urls: ['https://x.test/1'] });
      expect(l.subject).toContain('1 Main St');
      expect(l.body).toContain('https://x.test/1');
      expect(l.body).toContain('Ana');
    }
  });
});
