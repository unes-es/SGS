const PDFDocument = require('pdfkit')
const { createBaseDocument, addFooter, sectionTitle, row } = require('./pdf')

const MOIS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']

// ── ATTESTATION DE SCOLARITE ───────────────────────
function generateAttestationScolarite(doc, { eleve, document, centre }) {
   const u = eleve.utilisateur

   doc.font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#1e293b')
      .text('ATTESTATION DE SCOLARITE', 50, doc.y, { align: 'center', width: 495 })
   doc.moveDown(0.3)
   doc.font('Helvetica')
      .fontSize(10)
      .fillColor('#64748b')
      .text(`Annee scolaire ${document.anneeScolaire || '2025-2026'}`, 50, doc.y, { align: 'center', width: 495 })
   doc.moveDown(1.5)

   doc.font('Helvetica')
      .fontSize(11)
      .fillColor('#1e293b')
      .text(`Le Directeur de ${centre?.nom || "l'etablissement"} atteste que :`, { align: 'left' })
   doc.moveDown(1.5)

   sectionTitle(doc, 'Informations de l\'etudiant(e)')
   row(doc, 'Nom et prenom', `${u.prenom} ${u.nom}`)
   row(doc, 'Date de naissance', eleve.dateNaissance
      ? new Date(eleve.dateNaissance).toLocaleDateString('fr-FR')
      : '-')
   row(doc, 'CIN', eleve.cin || '-')
   row(doc, 'Matricule', eleve.matricule)
   row(doc, 'Filiere', eleve.classe?.filiere?.nom || '-')
   row(doc, 'Classe', eleve.classe?.nom || '-')
   doc.moveDown(1)

   doc.font('Helvetica')
      .fontSize(11)
      .fillColor('#1e293b')
      .text(
         `est regulierement inscrit(e) dans notre etablissement pour l'annee scolaire ${document.anneeScolaire || '2025-2026'} et suit les cours de la filiere ${eleve.classe?.filiere?.nom || '-'}.`, 50, doc.y,
         { align: 'justify', lineGap: 4, width: 495 }
      )
   doc.moveDown(1)
   doc.text(
      'En foi de quoi, la presente attestation lui est delivree pour servir et valoir ce que de droit.', 50, doc.y,
      { align: 'justify', lineGap: 4, width: 495 }
   )
   doc.moveDown(2)

   doc.font('Helvetica')
      .fontSize(10)
      .fillColor('#64748b')
      .text(`Fait a ${centre?.ville || 'Casablanca'}, le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' })
   doc.moveDown(0.5)
   doc.font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('Le Directeur', { align: 'right' })
   doc.moveDown(2)
   doc.font('Helvetica')
      .fillColor('#64748b')
      .fontSize(9)
      .text('Cachet et signature', { align: 'right' })
}

// ── RECU DE PAIEMENT ──────────────────────────────
function generateRecuPaiement(doc, { eleve, document, centre, paiement }) {
   const u = eleve.utilisateur
   const montant = paiement?.montant ? parseFloat(paiement.montant.toString()) : 0

   const formatMAD = (val) => {
      const n = parseFloat(val?.toString() || '0')
      return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
   }

   doc.font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#1e293b')
      .text('RECU DE PAIEMENT', 50, doc.y, { align: 'center', width: 495 })
   doc.moveDown(0.3)
   doc.font('Helvetica')
      .fontSize(10)
      .fillColor('#64748b')
      .text(`Reference : ${paiement?.reference || document.numeroSerie}`, 50, doc.y, { align: 'center', width: 495 })
   doc.moveDown(1.5)

   sectionTitle(doc, 'Informations de l\'etudiant(e)')
   row(doc, 'Nom et prenom', `${u.prenom} ${u.nom}`)
   row(doc, 'Matricule', eleve.matricule)
   row(doc, 'Classe', eleve.classe?.nom || '-')
   doc.moveDown(1)

   sectionTitle(doc, 'Details du paiement')
   row(doc, 'Type de frais', paiement?.typeFrais || '-')
   row(doc, 'Montant', `${formatMAD(paiement?.montant)} MAD`)
   row(doc, 'Mode de paiement', paiement?.modePaiement || '-')
   row(doc, 'Date de paiement', paiement?.datePaiement
      ? new Date(paiement.datePaiement).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR'))
   if (paiement?.periodeMois && paiement?.periodeAnnee) {
      row(doc, 'Periode', `${MOIS[paiement.periodeMois - 1]} ${paiement.periodeAnnee}`)
   }
   doc.moveDown(1.5)

   // Amount box
   const boxY = doc.y
   doc.rect(50, boxY, 495, 50).fill('#f0fdf4').stroke('#86efac')
   doc.font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#166534')
      .text(
         `Montant recu : ${formatMAD(paiement?.montant)} MAD`,
         50, boxY + 16,
         { align: 'center', width: 495 }
      )
   doc.moveDown(3)

   doc.font('Helvetica')
      .fontSize(10)
      .fillColor('#64748b')
      .text(`Fait a ${centre?.ville || 'Casablanca'}, le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' })
   doc.moveDown(0.5)
   doc.font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('Le Comptable', { align: 'right' })
}

// ── ATTESTATION DE TRAVAIL ─────────────────────────
function generateAttestationTravail(doc, { personnel, document, centre }) {
   const u = personnel.utilisateur

   doc.font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#1e293b')
      .text('ATTESTATION DE TRAVAIL', 50, doc.y, { align: 'center', width: 495 })
   doc.moveDown(1.5)

   doc.font('Helvetica')
      .fontSize(11)
      .fillColor('#1e293b')
      .text(
         `Le Directeur de ${centre?.nom || "l'etablissement"} atteste que :`,
         50, doc.y,
         { align: 'left', width: 495 }
      )
   doc.moveDown(1.5)

   sectionTitle(doc, 'Informations de l\'employe(e)')
   row(doc, 'Nom et prenom', `${u.prenom} ${u.nom}`)
   row(doc, 'CIN', personnel.cin || '-')
   row(doc, 'Poste', personnel.poste || '-')
   row(doc, 'Type de contrat', personnel.typeContrat || '-')
   row(doc, 'Date d\'embauche', personnel.dateEmbauche
      ? new Date(personnel.dateEmbauche).toLocaleDateString('fr-FR')
      : '-')
   doc.moveDown(1)

   doc.font('Helvetica')
      .fontSize(11)
      .fillColor('#1e293b')
      .text(
         `est employe(e) au sein de notre etablissement en qualite de ${personnel.poste || '-'} depuis le ${personnel.dateEmbauche ? new Date(personnel.dateEmbauche).toLocaleDateString('fr-FR') : '-'}.`,
         50, doc.y,
         { align: 'justify', lineGap: 4, width: 495 }
      )
   doc.moveDown(1)
   doc.text(
      'En foi de quoi, la presente attestation lui est delivree pour servir et valoir ce que de droit.',
      50, doc.y,
      { align: 'justify', lineGap: 4, width: 495 }
   )
   doc.moveDown(2)

   doc.font('Helvetica')
      .fontSize(10)
      .fillColor('#64748b')
      .text(`Fait a ${centre?.ville || 'Casablanca'}, le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' })
   doc.moveDown(0.5)
   doc.font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('Le Directeur', { align: 'right' })
}

// ── BULLETIN DE NOTES ──────────────────────────────
function generateBulletin(doc, { eleve, centre, periode, matieres, moyenne, mention, rang, totalEleves, anneeScolaire }) {
   const u = eleve.utilisateur

   // Title
   doc.font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#1e293b')
      .text('BULLETIN DE NOTES', 50, doc.y, { align: 'center', width: 495 })
   doc.moveDown(0.3)
   doc.font('Helvetica')
      .fontSize(10)
      .fillColor('#64748b')
      .text(`Periode : ${periode} · Annee scolaire ${anneeScolaire}`, 50, doc.y, { align: 'center', width: 495 })
   doc.moveDown(1.5)

   // Student info
   sectionTitle(doc, 'Informations de l\'etudiant(e)')
   row(doc, 'Nom et prenom', `${u.prenom} ${u.nom}`)
   row(doc, 'Matricule', eleve.matricule)
   row(doc, 'Filiere', eleve.classe?.filiere?.nom || '-')
   row(doc, 'Classe', eleve.classe?.nom || '-')
   doc.moveDown(1)

   // Notes table header
   const tableX = 50
   const colWidths = [220, 70, 70, 85]
   const tableWidth = colWidths.reduce((a, b) => a + b, 0)
   const rowH = 22

   // Header row
   let y = doc.y
   doc.rect(tableX, y, tableWidth, rowH).fill('#1e40af')
   doc.fillColor('white').font('Helvetica-Bold').fontSize(9)
   doc.text('MATIERE', tableX + 5, y + 7, { width: colWidths[0] - 5 })
   doc.text('COEFF.', tableX + colWidths[0], y + 7, { width: colWidths[1], align: 'center' })
   doc.text('MOYENNE/20', tableX + colWidths[0] + colWidths[1], y + 7, { width: colWidths[2], align: 'center' })
   doc.text('APPRECIATION', tableX + colWidths[0] + colWidths[1] + colWidths[2], y + 7, { width: colWidths[3], align: 'center' })
   y += rowH

   // Matiere rows
   matieres.forEach((m, i) => {
      const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff'
      doc.rect(tableX, y, tableWidth, rowH).fill(bg)

      // color code the note
      const noteColor = m.moyenne >= 16 ? '#16a34a'
         : m.moyenne >= 12 ? '#2563eb'
            : m.moyenne >= 10 ? '#d97706'
               : '#dc2626'

      doc.fillColor('#1e293b').font('Helvetica').fontSize(9)
      doc.text(m.nom, tableX + 5, y + 7, { width: colWidths[0] - 5 })
      doc.text(String(m.coefficient), tableX + colWidths[0], y + 7, { width: colWidths[1], align: 'center' })
      doc.fillColor(noteColor).font('Helvetica-Bold')
      doc.text(m.moyenne.toFixed(2), tableX + colWidths[0] + colWidths[1], y + 7, { width: colWidths[2], align: 'center' })
      doc.fillColor('#64748b').font('Helvetica').fontSize(8)
      doc.text(getMentionLabel(m.moyenne), tableX + colWidths[0] + colWidths[1] + colWidths[2], y + 7, { width: colWidths[3], align: 'center' })

      // border
      doc.rect(tableX, y, tableWidth, rowH).stroke('#e2e8f0')
      y += rowH
   })

   doc.y = y + 10

   // Summary box
   doc.moveDown(0.5)
   const boxY = doc.y
   doc.rect(50, boxY, 495, 55).fill('#f1f5f9').stroke('#e2e8f0')

   const moyenneColor = moyenne >= 16 ? '#16a34a'
      : moyenne >= 12 ? '#2563eb'
         : moyenne >= 10 ? '#d97706'
            : '#dc2626'

   doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(11)
      .text('Moyenne generale :', 60, boxY + 10)
   doc.fillColor(moyenneColor).fontSize(16)
      .text(moyenne ? moyenne.toFixed(2) + ' / 20' : '-', 200, boxY + 7)
   doc.fillColor('#1e293b').fontSize(10)
      .text('Mention :', 60, boxY + 32)
   doc.fillColor(moyenneColor)
      .text(mention || '-', 120, boxY + 32)
   doc.fillColor('#64748b').font('Helvetica').fontSize(9)
      .text(`Rang : ${rang || '-'} / ${totalEleves}`, 350, boxY + 19, { align: 'right', width: 185 })

   doc.moveDown(4)

   // Signature
   doc.fillColor('#64748b').font('Helvetica').fontSize(10)
      .text(`Fait a ${centre?.ville || 'Casablanca'}, le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' })
   doc.moveDown(0.5)
   doc.font('Helvetica-Bold').fillColor('#1e293b')
      .text('Le Directeur', { align: 'right' })
   doc.moveDown(2)
   doc.font('Helvetica').fillColor('#64748b').fontSize(9)
      .text('Cachet et signature', { align: 'right' })
}

function getMentionLabel(m) {
   if (m >= 16) return 'Tres bien'
   if (m >= 14) return 'Bien'
   if (m >= 12) return 'Assez bien'
   if (m >= 10) return 'Passable'
   return 'Insuffisant'
}

module.exports = {
   generateAttestationScolarite,
   generateRecuPaiement,
   generateAttestationTravail,
   generateBulletin,
}