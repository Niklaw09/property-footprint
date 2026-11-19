// Cloudflare Turnstile verification. https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
export async function verifyTurnstile(token: string | undefined, secret: string, ip?: string, fetchFn: typeof fetch = fetch): Promise<boolean> {
  if (!token || token.length > 2048) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== 'unknown') body.set('remoteip', ip);
  try {
    const res = await fetchFn('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    if (!res.ok) return false;
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
