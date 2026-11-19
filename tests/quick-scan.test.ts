import { describe, it, expect } from 'vitest';
import { createService } from '@engine/service.ts';
import { memoryStore } from '@engine/memoryStore.ts';
import { fixtureProvider } from '@engine/providers.ts';
import { parseSession } from '@engine/stripe.ts';

const results = { general: [{ url: 'https://www.estately.com/listings/info/14425-american-kestrel-dr-austin-tx-78738--2', title: '14425 American Kestrel Dr, Austin, TX 78738', snippet: '', via: '' }] };

function setup() {
  let clock = new Date('2026-11-19T12:00:00Z');
  const svc = createService({ store: memoryStore(), engine: () => ({ provider: fixtureProvider(results), lookups: [] }), now: () => clock });
  return { svc, advance: (ms: number) => (clock = new Date(clock.getTime() + ms)) };
}
const DAY = 86400000;

describe('$4.99 Quick scan', () => {
  it('offers both prices', async () => {
    const { svc } = setup();
    const { view } = await svc.scan({ address: '14425 American Kestrel Dr, Austin, TX 78738', userId: 'u1', ip: '1' });
    expect(view.prices).toEqual({ quick: 499, monitor: 1999 });
    expect(view.plan).toBeNull();
    expect(await svc.quote({ userId: 'u1', reportId: view.id, plan: 'quick' })).toEqual({ cents: 499, plan: 'quick', upgrade: false });
    expect(await svc.quote({ userId: 'u1', reportId: view.id, plan: 'monitor' })).toEqual({ cents: 1999, plan: 'monitor', upgrade: false });
  });

  it('unlocks the full report for 30 days with no re-checks or extra scans, then upgrades for the $15 difference', async () => {
    const { svc, advance } = setup();
    const { view: v0 } = await svc.scan({ address: '14425 American Kestrel Dr, Austin, TX 78738', userId: 'u1', ip: '1' });
    await svc.grantPurchase({ userId: 'u1', reportId: v0.id, sessionId: 'cs_q', amountCents: 499, plan: 'quick' });
    const v = await svc.getReport({ reportId: v0.id, userId: 'u1' });
    expect(v.unlocked).toBe(true);
    expect(v.plan).toBe('quick');
    expect(v.findings.every((f) => !f.locked)).toBe(true);
    expect(v.nextScanAt).toBeNull();
    expect(v.rescansLeft).toBe(0);
    expect(v.upgradeCents).toBe(1500);
    await expect(svc.rescan({ userId: 'u1', reportId: v0.id })).rejects.toMatchObject({ code: 'payment_required', detail: 'upgrade' });
    advance(61 * DAY);
    expect((await svc.runDue()).scanned).toBe(0); // no re-checks on a Quick scan
    expect((await svc.getReport({ reportId: v0.id, userId: 'u1' })).unlocked).toBe(false); // 30 days are up
  });

  it('upgrade: pays the difference and gets 12 months with re-checks', async () => {
    const { svc, advance } = setup();
    const { view: v0 } = await svc.scan({ address: '14425 American Kestrel Dr, Austin, TX 78738', userId: 'u1', ip: '1' });
    await svc.grantPurchase({ userId: 'u1', reportId: v0.id, sessionId: 'cs_q', amountCents: 499, plan: 'quick' });
    expect(await svc.quote({ userId: 'u1', reportId: v0.id, plan: 'quick' })).toBeNull(); // never charge twice
    expect(await svc.quote({ userId: 'u1', reportId: v0.id, plan: 'monitor' })).toEqual({ cents: 1500, plan: 'monitor', upgrade: true });
    advance(5 * DAY);
    await svc.grantPurchase({ userId: 'u1', reportId: v0.id, sessionId: 'cs_up', amountCents: 1500, plan: 'monitor' });
    const v = await svc.getReport({ reportId: v0.id, userId: 'u1' });
    expect(v.plan).toBe('monitor');
    expect(v.upgradeCents).toBeNull();
    expect(v.rescansLeft).toBe(2);
    expect(new Date(v.paidUntil!).getTime()).toBeGreaterThan(Date.parse('2027-11-19T00:00:00Z'));
    expect(await svc.quote({ userId: 'u1', reportId: v0.id, plan: 'monitor' })).toBeNull();
    advance(61 * DAY);
    expect((await svc.runDue()).scanned).toBe(1);
  });

  it('the launch offer stays the full 12-month plan', async () => {
    const svc = createService({ store: memoryStore(), engine: () => ({ provider: fixtureProvider(results), lookups: [] }), promoLimit: 1000 });
    const { view } = await svc.scan({ address: '14425 American Kestrel Dr, Austin, TX 78738', userId: 'u1', ip: '1' });
    const v = await svc.claimPromo({ userId: 'u1', reportId: view.id });
    expect(v.plan).toBe('monitor');
  });

  it('reads the plan from the Stripe session, defaulting to the 12-month plan', () => {
    expect(parseSession({ id: 'cs_1', payment_status: 'paid', amount_total: 499, metadata: { user_id: 'u', report_id: 'r', plan: 'quick' } }).plan).toBe('quick');
    expect(parseSession({ id: 'cs_2', payment_status: 'paid', amount_total: 1999, metadata: { user_id: 'u', report_id: 'r' } }).plan).toBe('monitor');
  });
});

describe('overnight fixes', () => {
  it('sends one review email per home, even after a Quick scan and an upgrade, without promising re-checks on a Quick scan', async () => {
    let clock = new Date('2026-11-19T12:00:00Z');
    const svc = createService({ store: memoryStore(), engine: () => ({ provider: fixtureProvider(results), lookups: [] }), now: () => clock });
    const { view } = await svc.scan({ address: '14425 American Kestrel Dr, Austin, TX 78738', userId: 'u1', ip: '1' });
    await svc.grantPurchase({ userId: 'u1', reportId: view.id, sessionId: 'cs_q', amountCents: 499, plan: 'quick' });
    await svc.grantPurchase({ userId: 'u1', reportId: view.id, sessionId: 'cs_up', amountCents: 1500, plan: 'monitor' });
    clock = new Date(clock.getTime() + 8 * DAY);
    const sent: any[] = [];
    expect(await svc.sendReviewEmails(async (x) => { sent.push(x); return true; })).toBe(1);
    expect(sent[0].plan).toBe('monitor');
    const { reviewEmail } = await import('@engine/reviewEmail.ts');
    expect(reviewEmail({ lang: 'en', display: 'x', reportUrl: 'u', googleUrl: null, plan: 'quick' }).text).not.toContain('re-checking');
    expect(reviewEmail({ lang: 'es', display: 'x', reportUrl: 'u', googleUrl: null, plan: 'quick' }).text).not.toContain('revisando');
    expect(reviewEmail({ lang: 'en', display: 'x', reportUrl: 'u', googleUrl: null }).text).toContain('re-checking');
  });

  it('My homes says which plan a home is on', async () => {
    const { svc } = setup();
    const { view } = await svc.scan({ address: '14425 American Kestrel Dr, Austin, TX 78738', userId: 'u1', ip: '1' });
    await svc.grantPurchase({ userId: 'u1', reportId: view.id, sessionId: 'cs_q', amountCents: 499, plan: 'quick' });
    const [row] = await svc.myReports('u1');
    expect(row.plan).toBe('quick');
    expect(row.nextScanAt).toBeNull();
  });

  it('does not mark the account as having used the launch offer when the spots ran out', async () => {
    const svc = createService({ store: memoryStore(), engine: () => ({ provider: fixtureProvider(results), lookups: [] }), promoLimit: 1 });
    const a = await svc.scan({ address: '14425 American Kestrel Dr, Austin, TX 78738', userId: 'u1', ip: '1' });
    const b = await svc.scan({ address: '14425 American Kestrel Dr, Austin, TX 78738', userId: 'u2', ip: '2' });
    await svc.claimPromo({ userId: 'u1', reportId: a.view.id });
    await expect(svc.claimPromo({ userId: 'u2', reportId: b.view.id })).rejects.toMatchObject({ code: 'promo_over' });
    expect((await svc.getReport({ reportId: b.view.id, userId: 'u2' })).promo?.usedByYou).toBe(false);
  });
});
