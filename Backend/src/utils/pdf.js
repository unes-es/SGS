const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const DEFAULT_BRAND_COLOR = '#1e40af'
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads')

function createBaseDocument(centre) {
  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true, margins: { top: 50, bottom: 60, left: 50, right: 50 } })

  // Stashed on the document itself (not just used locally) so every other
  // drawing helper in this file, and generateBulletin's own table-header
  // accent in pdfDocuments.js, can pick up the same centre color without
  // every function needing a `centre` parameter threaded through it.
  doc.brandColor = centre?.couleurPrimaire || DEFAULT_BRAND_COLOR

  // ── HEADER ─────────────────────────────────────
  doc.rect(0, 0, 595, 85).fill(doc.brandColor)

  doc.fillColor('white')
     .font('Helvetica-Bold')
     .fontSize(18)
     .text(centre?.nom || 'Ecole Superieure de Gestion et Sciences', 50, 18, { width: 390 })

  doc.font('Helvetica')
     .fontSize(9)
     .text(centre?.adresse || '', 50, 48)
     .text([centre?.telephone, centre?.email].filter(Boolean).join(' · ') || '', 50, 60)

  // Real logo when the centre has uploaded one (Sprint 6 - Paramètres);
  // falls back to the placeholder box for centres that haven't (or if the
  // stored file is missing/unreadable - a bad logo must never break PDF
  // generation for every document a centre issues).
  const logoPath = centre?.logoUrl && !centre.logoUrl.endsWith('.svg')
    ? path.join(UPLOADS_DIR, centre.logoUrl.replace(/^\/uploads\//, ''))
    : null
  let logoDrawn = false
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 490, 10, { fit: [65, 65], align: 'center', valign: 'center' })
      logoDrawn = true
    } catch {
      // Corrupt/unsupported image data - fall through to the placeholder.
    }
  }
  if (!logoDrawn) {
    doc.rect(490, 10, 65, 65).fill('#22c55e')
    doc.fillColor('white')
       .font('Helvetica-Bold')
       .fontSize(9)
       .text('LOGO', 504, 38)
  }

  doc.fillColor('#1e293b')
  doc.y = 110  // reset cursor below header with margin

  return doc
}

// qrBuffer (optional): a PNG buffer from utils/qr.js, drawn bottom-right of
// the footer. Only documents.service.js's generatePdf() passes one - those
// are the only PDFs backed by a real Document row a scanner can actually
// verify against (see documents.service.js's verify()). Bulletins
// (notes.controller.js) call this same function without one and just get
// the plain footer, same as before.
function addFooter(doc, numeroSerie, qrBuffer) {
  const pages = doc.bufferedPageRange()
  const lastPage = pages.start + pages.count - 1
  doc.switchToPage(lastPage)

  const footerY = 770
  doc.moveTo(50, footerY)
     .lineTo(545, footerY)
     .strokeColor('#e2e8f0')
     .lineWidth(1)
     .stroke()

  doc.fillColor('#94a3b8')
     .fontSize(8)
     .font('Helvetica')
     .text(
       `Document N° ${numeroSerie} · Genere le ${new Date().toLocaleDateString('fr-FR')} · SGS`,
       50, footerY + 8,
       { align: 'center', width: qrBuffer ? 440 : 495 }
     )

  if (qrBuffer) {
    try {
      doc.image(qrBuffer, 495, footerY + 4, { width: 40, height: 40 })
    } catch {
      // Never let a QR rendering failure take down document generation -
      // the document itself (and its footer text) is what actually matters.
    }
  }

  doc.flushPages()
}

function sectionTitle(doc, title) {
  const y = doc.y
  doc.rect(50, y, 495, 22).fill('#f1f5f9')
  doc.fillColor(doc.brandColor || DEFAULT_BRAND_COLOR)
     .font('Helvetica-Bold')
     .fontSize(9)
     .text(title.toUpperCase(), 60, y + 6, { width: 475 })
  doc.fillColor('#1e293b')
  doc.y = y + 28
}

function row(doc, label, value) {
  const y = doc.y
  doc.font('Helvetica')
     .fontSize(10)
     .fillColor('#64748b')
     .text(label, 60, y, { width: 175 })
  doc.font('Helvetica-Bold')
     .fillColor('#1e293b')
     .text(value || '-', 250, y, { width: 295 })
  doc.y = y + 18
}

module.exports = { createBaseDocument, addFooter, sectionTitle, row }