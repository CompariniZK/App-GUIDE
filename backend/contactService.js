// ============================================================================
// contactService.js — the website contact form, delivered to the owner's inbox
// ----------------------------------------------------------------------------
// The form on boussole.it.com POSTs here; we validate, then hand the message to
// Resend (already used for Supabase auth mail, domain boussole.it.com verified).
// `reply_to` is the visitor's address, so replying from the inbox reaches them.
//
// No auth: it's a public form. Abuse is handled by a strict rate limit in
// server.js plus a honeypot field.
// ============================================================================

const { RESEND_API_KEY } = process.env;

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'gabriel.comparini.ismart@gmail.com';
// Must be on a domain verified in Resend, otherwise the send is rejected.
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'Boussole <contact@boussole.it.com>';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** True when the form can actually deliver. Exposed via /api/health. */
export function contactConfigured() {
  return Boolean(RESEND_API_KEY);
}

const clean = (value, max) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export async function handleContact(req, res) {
  if (!RESEND_API_KEY) {
    return res.status(503).json({ error: 'Le formulaire n’est pas encore configuré.' });
  }

  const body = req.body || {};

  // Honeypot: a hidden field no human fills in. Accept silently so bots don't
  // learn they were caught, but send nothing.
  if (clean(body.website, 200)) {
    return res.status(200).json({ ok: true });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 254);
  const organisation = clean(body.organisation, 160);
  const subject = clean(body.subject, 120) || 'Contact';
  const message = clean(body.message, 5000);

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nom, e-mail et message sont requis.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Adresse e-mail invalide.' });
  }

  // Plain text only — nothing here is interpreted as markup.
  const text = [
    `Nom          : ${name}`,
    `E-mail       : ${email}`,
    organisation ? `Organisation : ${organisation}` : null,
    `Sujet        : ${subject}`,
    '',
    'Message :',
    message,
    '',
    '— envoyé depuis le formulaire de boussole.it.com',
  ].filter(Boolean).join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `[Boussole] ${subject} — ${name}`,
        text,
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('[contact] Resend rejected the message:', r.status, detail.slice(0, 300));
      return res.status(502).json({ error: 'Envoi impossible pour le moment.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[contact] send failed:', err?.message || err);
    return res.status(502).json({ error: 'Envoi impossible pour le moment.' });
  }
}
