import { describe, it, expect } from 'vitest';
import { createService } from '@engine/service.ts';
import { memoryStore } from '@engine/memoryStore.ts';
import { fixtureProvider } from '@engine/providers.ts';
import { reviewEmail } from '@engine/reviewEmail.ts';

const results = {
  general: [{ url: 'https://www.estately.com/listings/info/14425-american-kestrel-dr-austin-tx-78738--2', title: '14425 American Kestrel Dr, Austin, TX 78738', snippet: '', via: '' }],
};
const A = '14425 American Kestrel Dr, Austin, TX 78738';
const B = '6413 York Bridge Cir, Austin, TX 78749';

function setup(promoLimit = 2) {
  let clock = new Date('2026-11-19T12:00:00Z');
  const svc = createService({
    store: memoryStore(), engine: () => ({ provider: fixtureProvider(results), lookups: [] }), now: () => clock,
    promoLimit, reviewUrl: 'https://g.page/r/example/review',
  });
  const saved = async (address: string, userId: string) => {
    const { view } = await svc.scan({ address, userId, ip: userId });
    return view;
  };
  return { svc, saved, advance: (ms: number) => (clock = new Date(clock.getTime() + ms)) };
}

describe('launch offer', () => {
  it('unlocks free while spots last, one home per account, and counts down', async () => {
    const { svc, saved } = setup(2);
    const v1 = await saved(A, 'u1');
    expect(v1.promo).toEqual({ left: 2, total: 2, usedByYou: false });
    const u1 = await svc.claimPromo({ userId: 'u1', reportId: v1.id });
    expect(u1.unlocked).toBe(true);
    expect(u1.promo).toBeNull();
    expect(u1.paidUntil).toBeTruthy();
    // Same account, second home: not free
    const v1b = await saved(B, 'u1');
    expect(v1b.promo).toMatchObject({ left: 1, usedByYou: true });
    await expect(svc.claimPromo({ userId: 'u1', reportId: v1b.id })).rejects.toMatchObject({ code: 'promo_used' });
    // Another account takes the last spot; a third is told it's over
    const v2 = await saved(B, 'u2');
    await svc.claimPromo({ userId: 'u2', reportId: v2.id });
    const v3 = await saved(A, 'u3');
    expect(v3.promo).toMatchObject({ left: 0 });
    await expect(svc.claimPromo({ userId: 'u3', reportId: v3.id })).rejects.toMatchObject({ code: 'promo_over' });
    expect(await svc.promoStatus()).toEqual({ left: 0, total: 2, usedByYou: false });
  });

  it('needs the home saved to the account and is off when the limit is 0', async () => {
    const { svc, saved } = setup(2);
    const v = await saved(A, 'u1');
    await expect(svc.claimPromo({ userId: 'other', reportId: v.id })).rejects.toMatchObject({ code: 'forbidden' });
    const off = setup(0);
    const w = await off.saved(A, 'u1');
    expect(w.promo).toBeNull();
    await expect(off.svc.claimPromo({ userId: 'u1', reportId: w.id })).rejects.toMatchObject({ code: 'promo_over' });
  });
});

describe('reviews', () => {
  it('are optional, validated, and never change access', async () => {
    const { svc, saved } = setup();
    const v = await saved(A, 'u1');
    await svc.claimPromo({ userId: 'u1', reportId: v.id });
    let view = await svc.getReport({ reportId: v.id, userId: 'u1' });
    expect(view.review).toEqual({ done: false, googleUrl: 'https://g.page/r/example/review' });
    await expect(svc.submitReview({ userId: 'u1', reportId: v.id, rating: 0 })).rejects.toMatchObject({ code: 'invalid_review' });
    await expect(svc.submitReview({ userId: 'x', reportId: v.id, rating: 5 })).rejects.toMatchObject({ code: 'forbidden' });
    await svc.submitReview({ userId: 'u1', reportId: v.id, rating: 2, comment: 'Zillow took a while' });
    view = await svc.getReport({ reportId: v.id, userId: 'u1' });
    expect(view.review?.done).toBe(true);
    expect(view.unlocked).toBe(true);
  });

  it('sends one follow-up email about a week after unlocking', async () => {
    const { svc, saved, advance } = setup();
    const v = await saved(A, 'u1');
    await svc.claimPromo({ userId: 'u1', reportId: v.id, lang: 'es' });
    const sent: any[] = [];
    const send = async (x: any) => { sent.push(x); return true; };
    advance(6 * 86400000);
    expect(await svc.sendReviewEmails(send)).toBe(0);
    advance(1.5 * 86400000);
    expect(await svc.sendReviewEmails(send)).toBe(1);
    expect(sent[0]).toMatchObject({ userId: 'u1', reportId: v.id, lang: 'es', display: A });
    advance(86400000);
    expect(await svc.sendReviewEmails(send)).toBe(0); // never twice
  });

  it('email asks for an honest review with no incentive', () => {
    for (const lang of ['en', 'es']) {
      const m = reviewEmail({ lang, display: A, reportUrl: 'https://homeprint.online/#/r/1', googleUrl: 'https://g.page/r/example/review' });
      expect(m.text).toContain('https://homeprint.online/#/r/1');
      expect(m.text).toContain('https://g.page/r/example/review');
      expect(m.html).toContain('href="https://g.page/r/example/review"');
      expect(m.text.toLowerCase()).not.toMatch(/free|discount|gift|reward|gratis|regalo|descuento/);
    }
    expect(reviewEmail({ lang: 'en', display: '<b>x</b>', reportUrl: 'u', googleUrl: null }).html).not.toContain('<b>x</b>');
  });
});
