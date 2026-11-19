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

describe('removal guides (visuals, more info, coverage)', () => {
  const all = Object.values(PLAYBOOKS);
  it('every guide has a translated route diagram and translated More info', () => {
    for (const p of all) {
      expect(p.flow.length, p.key).toBeGreaterThanOrEqual(2);
      for (const f of p.flow) expect(f.en && f.es, p.key).toBeTruthy();
      for (const m of p.more ?? []) expect(m.q.en && m.q.es && m.a.en && m.a.es, p.key).toBeTruthy();
      for (const s of p.steps) {
        if (s.more) expect(s.more.en && s.more.es, p.key).toBeTruthy();
        if (s.ui) expect(s.ui.trail.length, p.key).toBeGreaterThan(0);
      }
      for (const c of p.contacts ?? []) if (c.kind === 'url') expect(c.value.startsWith('https://')).toBe(true);
    }
  });
  it('priority sites get their own guide, not the generic one', () => {
    const own = ['zillow', 'trulia', 'redfin', 'realtor', 'homes', 'movoto', 'estately', 'har', 'kw', 'remax', 'exp', 'compass', 'coldwellbanker', 'century21', 'sothebys', 'bhhs', 'howardhanna', 'real',
      'youtube', 'facebook', 'instagram', 'tiktok', 'pinterest', 'vimeo', 'matterport'];
    for (const key of own) {
      const site = SITES.find((s) => s.key === key);
      expect(site, key).toBeDefined();
      expect(site!.playbook, key).not.toBe('brokerage');
      expect(site!.playbook, key).not.toBe('generic_portal');
    }
  });
  it('Spanish guide text uses tú like the rest of the app', () => {
    const formal = /\b(usted|Inicie|Haga|Abra|Pida|Envíe|Escriba|Busque|Guarde|Marque|Espere|Copie|Siga|Contacte|Reporte|Elija|Anote|su casa|su dirección)\b/;
    for (const p of all) {
      const texts = [p.outcome.es, ...p.flow.map((f) => f.es), ...p.steps.flatMap((s) => [s.es, s.more?.es ?? '']), ...(p.tips ?? []).map((x) => x.es), ...(p.more ?? []).flatMap((m) => [m.q.es, m.a.es])];
      for (const s of texts) expect(formal.test(s), `${p.key}: ${s.slice(0, 60)}`).toBe(false);
    }
  });
});
