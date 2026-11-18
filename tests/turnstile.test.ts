import { it, expect } from 'vitest';
import { verifyTurnstile } from '@engine/turnstile.ts';

const fake = (ok: boolean, success: boolean) => (async (_u: string, init?: RequestInit) => {
  expect(String(init?.body)).toContain('secret=s');
  return new Response(JSON.stringify({ success }), { status: ok ? 200 : 500 });
}) as unknown as typeof fetch;

it('accepts a valid token and rejects bad, missing or errored ones', async () => {
  expect(await verifyTurnstile('tok', 's', '1.2.3.4', fake(true, true))).toBe(true);
  expect(await verifyTurnstile('tok', 's', '1.2.3.4', fake(true, false))).toBe(false);
  expect(await verifyTurnstile('tok', 's', '1.2.3.4', fake(false, true))).toBe(false);
  expect(await verifyTurnstile(undefined, 's')).toBe(false);
});
