const QRCode = require('qrcode')

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

function verifyUrl(numeroSerie) {
  return `${FRONTEND_URL}/verify/${numeroSerie}`
}

// Returns a PNG Buffer, or null on failure - callers (see
// utils/pdf.js's addFooter) must treat a missing QR as non-fatal, never
// let it break document generation.
async function generateVerifyQr(numeroSerie) {
  try {
    return await QRCode.toBuffer(verifyUrl(numeroSerie), {
      type: 'png',
      margin: 1,
      width: 160
    })
  } catch (err) {
    console.error('QR generation failed:', err)
    return null
  }
}

module.exports = { verifyUrl, generateVerifyQr }
