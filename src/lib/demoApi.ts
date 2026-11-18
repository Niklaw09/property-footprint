// Demo mode: runs the real engine and service in the browser against a recorded sample.
// The sample URLs are real pages found for this address in the Nov 2026 accuracy test.
import { createService, ServiceError } from '@engine/service.ts';
import { memoryStore } from '@engine/memoryStore.ts';
import { fixtureProvider, type PortalLookup } from '@engine/providers.ts';
import { ApiError, type Api } from './api';

export const DEMO_ADDRESS = '14425 American Kestrel Dr, Austin, TX 78738';
const T = '14425 American Kestrel Dr, Austin, TX 78738';

const lookups: PortalLookup[] = [
  { key: 'zillow', async run() { return [{ url: 'https://www.zillow.com/homedetails/70333738_zpid/', title: T, snippet: '', via: 'lookup:zillow', addressText: T }]; } },
  { key: 'redfin', async run() { return [{ url: 'https://www.redfin.com/TX/Austin/14425-American-Kestrel-Dr-78738/home/30962292', title: T, snippet: '', via: 'lookup:redfin', addressText: `${T} TX Austin 14425 American Kestrel Dr 78738 home` }]; } },
];

const provider = fixtureProvider({
  portals: [
    { url: 'https://www.estately.com/listings/info/14425-american-kestrel-dr-austin-tx-78738--2', title: T, snippet: '', via: '' },
  ],
  brokerages: [
    { url: 'https://har.com/homedetail/14425-american-kestrel-dr-austin-tx-78738/6791779', title: T, snippet: '', via: '' },
    { url: 'https://www.houzeo.com/homes/14425-american-kestrel-dr-austin-tx-78738/hzid_6394d63e', title: T, snippet: '', via: '' },
    { url: 'https://ashbyre.realgeeks.com/property/3777682/', title: T, snippet: '', via: '' },
  ],
  general: [
    { url: 'https://thekeenangroup.com/14425-american-kestrel-dr-austin-tx-78738', title: T, snippet: '', via: '' },
    { url: 'https://www.spyglassrealty.com/listing/5322164-14425-american-kestrel-drive-austin-tx-78738', title: '14425 American Kestrel Drive, Austin, TX 78738', snippet: '', via: '' },
    { url: 'https://neuhausre.com/properties/austin/14425-american-kestrel-dr-01257001460000', title: T, snippet: '', via: '' },
    { url: 'https://robertjfischer.realgeeks.com/property/3777682/', title: T, snippet: '', via: '' },
    // Recorded false positives: the engine filters these out
    { url: 'https://www.google.com/maps/search/14425+American+Kestrel+Dr', title: T, snippet: '', via: '' },
    { url: 'https://www.ownerly.com/tx/austin/american-kestrel-dr/14425', title: T, snippet: '', via: '' },
    { url: 'https://www.redfin.com/TX/Austin/14427-American-Kestrel-Dr-78738/home/30962290', title: '14427 American Kestrel Dr', snippet: `Next door to ${T}`, via: '' },
  ],
});

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function demoApi(): Api {
  const svc = createService({
    store: memoryStore(),
    engine: () => ({ provider, lookups }),
    limits: { perIpPer10Min: 1000, perDay: 100000 },
  });
  let user: { email: string } | null = null;
  const listeners = new Set<(u: { email: string } | null) => void>();
  const uid = () => (user ? 'demo-user' : null);
  const wrap = async <T>(fn: () => Promise<T>): Promise<T> => {
    try { return await fn(); } catch (e) {
      if (e instanceof ServiceError) throw new ApiError(e.code, e.detail);
      throw e;
    }
  };
  return {
    mode: 'demo',
    async scan(_address) {
      await delay(2600); // let the progress screen play
      return wrap(() => svc.scan({ address: DEMO_ADDRESS, userId: uid(), ip: 'demo' }));
    },
    report: (id, token) => wrap(() => svc.getReport({ reportId: id, userId: uid(), claimToken: token })),
    task: (id, fid, status, note) => wrap(() => svc.updateTask({ userId: uid()!, reportId: id, fid, status, note })),
    membership: (id, patch) => wrap(() => svc.updateMembership({ userId: uid()!, reportId: id, ...patch })),
    rescan: (id) => wrap(() => svc.rescan({ userId: uid()!, reportId: id })),
    mine: () => wrap(() => svc.myReports(uid()!)),
    async selftest() { throw new ApiError('not_configured'); },
    async session() { return user; },
    onAuth(cb) { listeners.add(cb); return () => listeners.delete(cb); },
    async sendMagicLink(email) {
      user = { email: email || 'demo@example.com' };
      listeners.forEach((l) => l(user));
    },
    async signOut() { user = null; listeners.forEach((l) => l(null)); },
  };
}
