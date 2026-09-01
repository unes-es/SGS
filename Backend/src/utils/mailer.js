// Resend, via a plain fetch call rather than their SDK - Resend's API is a
// single simple POST endpoint, and Node 20 (this project's runtime, see
// Dockerfile) has fetch built in, so this avoids adding a whole SDK
// dependency for one HTTP call.
const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'SGS <onboarding@resend.dev>'

// Never throws - a failed email should never be what breaks a candidature
// submission, a password reset request, etc. Callers get a
// { sent: boolean } back and can log/handle it, but the calling
// request should still succeed either way.
async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.error('sendEmail: RESEND_API_KEY not configured, email not sent:', { to, subject })
    return { sent: false }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html })
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('sendEmail: Resend API error', res.status, body)
      return { sent: false }
    }

    return { sent: true }
  } catch (err) {
    console.error('sendEmail: request failed', err)
    return { sent: false }
  }
}

// Shared wrapper so every transactional email looks like it's actually
// from SGS, not a bare unstyled string - one place to adjust the look
// later (e.g. once a centre logo is available here too, see Sprint 6).
function wrapEmail(title, bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1e40af; margin: 0 0 16px;">${title}</h2>
      ${bodyHtml}
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">SGS — École Supérieure de Gestion et Sciences</p>
    </div>
  `
}

module.exports = { sendEmail, wrapEmail }
