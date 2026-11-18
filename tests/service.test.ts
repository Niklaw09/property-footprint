import { describe, it, expect } from 'vitest';
import { createService, ServiceError } from '@engine/service.ts';
import { memoryStore } from '@engine/memoryStore.ts';
import { fixtureProvider, type PortalLookup } from '@engine/providers.ts';

const zillow: PortalLookup = { key: 'zillow', async run() {
  return [{ url: 'https://www.zillow.com/homedetails/70333738_zpid/', title: '14425 American Kestrel Dr, Austin, TX 78738', snippet: '', via: 'lookup:zillow', addressText: '14425 American Kestrel Dr Austin TX 78738' }];
} };
let results: Record<string, any[]> = {
  general: [
    { url: 'https://www.estately.com/listings/info/14425-american-kestrel-dr-austin-tx-78738--2', title: '14425 American Kestrel Dr, Austin, TX 78738', snippet: '', via: '' },
    { url: 'https://har.com/homedetail/14425-american-kestrel-dr-austin-tx-78738/6791779', title: '14425 American Kestrel Dr', snippet: '', via: '' },
  ],
};

function setup(t0 = new Date('2026-11-18T12:00:00Z')) {
  let clock = t0;
  const store = memoryStore();
  let gone = new Set<string>();
  const svc = createService({
    store,
    engine: () => ({ provider: fixtureProvider(results), lookups: [zillow] }),
    now: () => clock,
    verifyGone: async (url) => (gone.has(url) ? 'gone' : 'live'),
  });
  return { svc, store, advance: (ms: number) => (clock = new Date(clock.getTime() + ms)), setGone: (s: string[]) => (gone = new Set(s)) };
}

describe('service', () => {
  it('anonymous scan shows counts and exactly one open preview with no leaked URLs', async () => {
    const { svc } = setup();
    const { view, claimToken } = await svc.scan({ address: '14425 American Kestrel Dr, Austin, TX 78738', userId: null, ip: '1.1.1.1' });
    expect(view.counts.total).toBe(3);
    const open = view.findings.filter((f) => !f.locked);
    expect(open).toHaveLength(1);
    expect((open[0] as any).siteKey).toBe('zillow'); // portal lookup wins the preview
    const json = JSON.stringify(view.findings.filter((f) => f.locked));
    expect(json).not.toContain('http');
    expect(json).not.toContain('estately.com/listings');
    expect(claimToken).toMatch(/^[0-9a-f]{48}$/);
  });

  it('claim token saves the home after sign-in; payment unlocks it for 12 months', async () => {
    const { svc, advance } = setup();
    const { view, claimToken } = await svc.scan({ address: '14425 American Kestrel Dr, Austin, TX 78738', userId: null, ip: '1.1.1.1' });
    const saved = await svc.getReport({ reportId: view.id, userId: 'u1', claimToken });
    expect(saved.member).toBe(true);
    expect(saved.unlocked).toBe(false);
    expect(saved.findings.filter((f) => !f.locked)).toHaveLength(1);
    expect(saved.price).toEqual({ cents: 2900, currency: 'usd' });
    const other = await svc.getReport({ reportId: view.id, userId: 'u2', claimToken });
    expect(other.member).toBe(false);
    expect(await svc.grantPurchase({ userId: 'u1', reportId: view.id, sessionId: 'cs_1', amountCents: 2900 })).toBe(true);
    expect(await svc.grantPurchase({ userId: 'u1', reportId: view.id, sessionId: 'cs_1', amountCents: 2900 })).toBe(false); // webhook retry
    const full = await svc.getReport({ reportId: view.id, userId: 'u1' });
    expect(full.unlocked).toBe(true);
    expect(full.findings.every((f) => !f.locked)).toBe(true);
    expect(full.rescansLeft).toBe(2);
    advance(366 * 86400000);
    expect((await svc.getReport({ reportId: view.id, userId: 'u1' })).unlocked).toBe(false);
  });

  it('tracking and re-scans need payment', async () => {
    const { svc } = setup();
    const { view } = await svc.scan({ address: '14425 American Kestrel Dr, Austin, TX 78738', userId: 'u1', ip: '1' });
    await expect(svc.updateTask({ userId: 'u1', reportId: view.id, fid: 'x', status: 'sent' })).rejects.toMatchObject({ code: 'payment_required' });
    await expect(svc.rescan({ userId: 'u1', reportId: view.id })).rejects.toMatchObject({ code: 'payment_required' });
    expect((await svc.runDue()).scanned).toBe(0);
  });

  it('limits anonymous new scans per IP per day, but repeat addresses stay free', async () => {
    const { svc } = setup();
    for (let i = 0; i < 3; i++) await svc.scan({ address: `${100 + i} Main St, Austin, TX 78701`, userId: null, ip: '2.2.2.2' });
    await expect(svc.scan({ address: '200 Main St, Austin, TX 78701', userId: null, ip: '2.2.2.2' })).rejects.toMatchObject({ code: 'limit_anon' });
    // cached address: no search spend, allowed
    await expect(svc.scan({ address: '100 Main St, Austin, TX 78701', userId: null, ip: '2.2.2.2' })).resolves.toBeTruthy();
    // another visitor is unaffected
    await expect(svc.scan({ address: '201 Main St, Austin, TX 78701', userId: null, ip: '3.3.3.3' })).resolves.toBeTruthy();
    // signing in lifts the anonymous limit
    await expect(svc.scan({ address: '202 Main St, Austin, TX 78701', userId: 'u9', ip: '2.2.2.2' })).resolves.toBeTruthy();
  });

  it('limits accounts, bursts and the whole site', async () => {
    const { svc, advance } = setup();
    for (let i = 0; i < 6; i++) { await svc.scan({ address: `${300 + i} Oak St, Austin, TX 78701`, userId: 'u1', ip: '4.4.4.4' }); }
    await expect(svc.scan({ address: '399 Oak St, Austin, TX 78701', userId: 'u1', ip: '4.4.4.4' })).rejects.toMatchObject({ code: 'busy' });
    advance(11 * 60000);
    for (let i = 0; i < 4; i++) await svc.scan({ address: `${400 + i} Oak St, Austin, TX 78701`, userId: 'u1', ip: '4.4.4.4' });
    await expect(svc.scan({ address: '499 Oak St, Austin, TX 78701', userId: 'u1', ip: '4.4.4.4' })).rejects.toMatchObject({ code: 'limit_user' });
    const capped = createService({ store: memoryStore(), engine: () => ({ provider: fixtureProvider(results), lookups: [zillow] }), limits: { perDay: 1 } });
    await capped.scan({ address: '1 Elm St, Austin, TX 78701', userId: null, ip: 'a' });
    await expect(capped.scan({ address: '2 Elm St, Austin, TX 78701', userId: null, ip: 'b' })).rejects.toMatchObject({ code: 'daily_limit' });
  });

  it('caps homes per account', async () => {
    const svc = createService({ store: memoryStore(), engine: () => ({ provider: fixtureProvider(results), lookups: [zillow] }), limits: { maxHomesPerUser: 2 } });
    await svc.scan({ address: '1 Elm St, Austin, TX 78701', userId: 'u', ip: 'a' });
    await svc.scan({ address: '2 Elm St, Austin, TX 78701', userId: 'u', ip: 'a' });
    await expect(svc.scan({ address: '3 Elm St, Austin, TX 78701', userId: 'u', ip: 'a' })).rejects.toMatchObject({ code: 'limit_homes' });
    await expect(svc.scan({ address: '1 Elm St, Austin, TX 78701', userId: 'u', ip: 'a' })).resolves.toBeTruthy();
  });

  it('rejects bad addresses clearly', async () => {
    const { svc } = setup();
    await expect(svc.scan({ address: 'hello', userId: null, ip: 'x' })).rejects.toBeInstanceOf(ServiceError);
  });

  it('tracks tasks, re-checks twice a month, limits manual re-scans and verifies removals', async () => {
    const { svc, advance, setGone } = setup();
    const { view: v0 } = await svc.scan({ address: '14425 American Kestrel Dr, Austin, TX 78738', userId: 'u1', ip: '1' });
    await svc.grantPurchase({ userId: 'u1', reportId: v0.id, sessionId: 'cs_2', amountCents: 2900 });
    const view = await svc.getReport({ reportId: v0.id, userId: 'u1' });
    const estately = view.findings.find((f) => !f.locked && f.siteKey === 'estately')!;
    await svc.updateTask({ userId: 'u1', reportId: view.id, fid: estately.id, status: 'sent' });
    // Site takes the page down
    results = { general: results.general.slice(1) };
    setGone(['https://www.estately.com/listings/info/14425-american-kestrel-dr-austin-tx-78738--2']);
    advance(10 * 86400000);
    expect((await svc.runDue()).scanned).toBe(0); // not due yet
    advance(6 * 86400000);
    expect((await svc.runDue()).scanned).toBe(1);
    const after = await svc.getReport({ reportId: view.id, userId: 'u1' });
    const e = after.findings.find((f) => f.id === estately.id) as any;
    expect(e.stillFound).toBe(false);
    expect(e.goneVerifiedAt).toBeTruthy();
    expect(e.task.status).toBe('sent');
    expect(after.history[0]).toMatchObject({ kind: 'scheduled', goneCount: 1 });
    const mine = await svc.myReports('u1');
    expect(mine[0]).toMatchObject({ removed: 1, total: 3 });
    await expect(svc.rescan({ userId: 'u1', reportId: view.id })).rejects.toMatchObject({ code: 'too_soon' }); // 12h gap
    advance(13 * 3600000);
    await svc.rescan({ userId: 'u1', reportId: view.id });
    advance(13 * 3600000);
    await svc.rescan({ userId: 'u1', reportId: view.id });
    advance(13 * 3600000);
    await expect(svc.rescan({ userId: 'u1', reportId: view.id })).rejects.toMatchObject({ code: 'too_soon' }); // 2 per 30 days
    await expect(svc.updateTask({ userId: 'u2', reportId: view.id, fid: estately.id, status: 'sent' })).rejects.toMatchObject({ code: 'forbidden' });
  });
});
