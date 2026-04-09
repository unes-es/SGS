const PDFDocument = require('pdfkit')

function createBaseDocument(centre) {
  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true, margins: { top: 50, bottom: 60, left: 50, right: 50 } })

  // ── HEADER ─────────────────────────────────────
  doc.rect(0, 0, 595, 85).fill('#1e40af')

  doc.fillColor('white')
     .font('Helvetica-Bold')
     .fontSize(18)
     .text(centre?.nom || 'Ecole Superieure de Gestion et Sciences', 50, 18, { width: 390 })

  doc.font('Helvetica')
     .fontSize(9)
     .text(centre?.adresse || '', 50, 48)
     .text([centre?.telephone, centre?.email].filter(Boolean).join(' · ') || '', 50, 60)

  // Logo placeholder
  doc.rect(490, 10, 65, 65).fill('#22c55e')
  doc.fillColor('white')
     .font('Helvetica-Bold')
     .fontSize(9)
     .text('LOGO', 504, 38)

  doc.fillColor('#1e293b')
  doc.y = 110  // reset cursor below header with margin

  return doc
}

function addFooter(doc, numeroSerie) {
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
       { align: 'center', width: 495 }
     )
  
  doc.flushPages()
}

function sectionTitle(doc, title) {
  const y = doc.y
  doc.rect(50, y, 495, 22).fill('#f1f5f9')
  doc.fillColor('#1e40af')
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