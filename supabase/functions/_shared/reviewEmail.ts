// The one follow-up email sent about a week after a home is unlocked.
// It asks for an honest review. Nothing is offered in exchange, and the unlock never depends on it
// (Google's review policy and the FTC's rule on consumer reviews ban incentivized or gated reviews).

export interface ReviewEmailInput {
  lang: string;
  display: string; // the home's address
  reportUrl: string; // link back to the report, where the on-site review form is
  googleUrl: string | null;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function reviewEmail(i: ReviewEmailInput): { subject: string; text: string; html: string } {
  const es = i.lang === 'es';
  const subject = es ? '¿Cómo te va con HomePrint?' : 'How is HomePrint working for you?';
  const lines = es
    ? [
      'Hola,',
      `Hace una semana desbloqueaste ${i.display} en HomePrint. Esperamos que ya se hayan quitado algunas fotos.`,
      'Si tienes un minuto, nos ayudaría mucho saber qué te pareció, sea bueno o malo. Es totalmente opcional y no cambia nada en tu cuenta.',
      `Deja tu opinión en tu informe: ${i.reportUrl}`,
      ...(i.googleUrl ? [`O en Google: ${i.googleUrl}`] : []),
      'Seguiremos revisando tu casa automáticamente. Este es el único correo que te enviaremos sobre esto.',
      'Gracias,',
      'HomePrint',
    ]
    : [
      'Hi,',
      `A week ago you unlocked ${i.display} on HomePrint. We hope some of those photos are already coming down.`,
      'If you have a minute, we’d really like to hear how it went, good or bad. It’s completely optional and doesn’t change anything on your account.',
      `Leave a review on your report: ${i.reportUrl}`,
      ...(i.googleUrl ? [`Or on Google: ${i.googleUrl}`] : []),
      'We’ll keep re-checking your home automatically. This is the only email we’ll send about this.',
      'Thanks,',
      'HomePrint',
    ];
  const text = lines.join('\n\n');
  const link = (url: string, label: string) => `<a href="${esc(url)}" style="color:#3f5f3a">${esc(label)}</a>`;
  const htmlLines = lines.map((l) => {
    if (l.includes(i.reportUrl)) return link(i.reportUrl, es ? 'Deja tu opinión en tu informe' : 'Leave a review on your report');
    if (i.googleUrl && l.includes(i.googleUrl)) return link(i.googleUrl, es ? 'Opinar en Google' : 'Review us on Google');
    return esc(l);
  });
  const html = `<div style="font-family:Georgia,serif;color:#1c2b45;font-size:16px;line-height:1.5;max-width:560px">${htmlLines.map((l) => `<p>${l}</p>`).join('')}</div>`;
  return { subject, text, html };
}

/** Send through Resend (https://resend.com). Returns true when accepted. */
export async function sendWithResend(apiKey: string, from: string, to: string, msg: { subject: string; text: string; html: string }, fetchFn: typeof fetch = fetch): Promise<boolean> {
  const res = await fetchFn('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject: msg.subject, text: msg.text, html: msg.html }),
  });
  return res.ok;
}
