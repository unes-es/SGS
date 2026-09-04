const prisma = require('../../config/db')
const { assertSameCentre } = require('../../utils/centreAccess')

async function getAll({ eleveId, type, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit

  const where = {
    ...(eleveId && { eleveId }),
    ...(type && { type })
  }

  const [total, documents] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        eleve: {
          include: {
            utilisateur: { select: { prenom: true, nom: true } }
          }
        },
        genereParUser: { select: { prenom: true, nom: true } }
      }
    })
  ])

  return {
    data: documents,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}

async function getById(id, user) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      eleve: {
        include: {
          utilisateur: { select: { prenom: true, nom: true } },
          classe: {
            include: { filiere: { select: { nom: true } } }
          }
        }
      },
      personnel: { select: { centreId: true } },
      genereParUser: { select: { prenom: true, nom: true } }
    }
  })
  if (!doc) throw { statusCode: 404, message: 'Document non trouvé' }
  // A document is tied to an élève OR a personnel record, never both -
  // same either/or as generatePdf()'s documentCentreId below. Neither set
  // (a generic AUTRE document with no target) isn't ambiguous cross-
  // centre data, so there's nothing to check against.
  const documentCentreId = doc.eleve?.centreId ?? doc.personnel?.centreId
  if (documentCentreId) assertSameCentre(documentCentreId, user, 'Document non trouvé')
  return doc
}

async function create(data, generePar) {
  const count = await prisma.document.count()
  const prefix = getPrefix(data.type)
  const numeroSerie = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  return prisma.document.create({
    data: {
      ...data,
      generePar,
      numeroSerie,
      fichierUrl: data.fichierUrl || `/documents/${numeroSerie}.pdf`,
      // '' (unselected in a dropdown) must not reach Prisma as a foreign
      // key - these are all optional relation columns, so an empty string
      // would fail the constraint instead of just meaning "none selected".
      eleveId: data.eleveId || null,
      paiementId: data.paiementId || null,
      personnelId: data.personnelId || null
    },
    include: {
      eleve: {
        include: {
          utilisateur: { select: { prenom: true, nom: true } }
        }
      },
      personnel: {
        include: {
          utilisateur: { select: { prenom: true, nom: true } }
        }
      },
      genereParUser: { select: { prenom: true, nom: true } }
    }
  })
}

async function remove(id, user) {
  await getById(id, user)
  return prisma.document.delete({ where: { id } })
}

async function getByEleve(eleveId, user) {
  if (user && user.role !== 'SUPER_ADMIN') {
    const eleve = await prisma.eleve.findUnique({ where: { id: eleveId }, select: { centreId: true } })
    // A nonexistent eleveId here isn't a leak either way - falls through
    // to an empty list below exactly like a real one with zero documents
    // would, so there's nothing to distinguish by 404ing separately.
    if (eleve) assertSameCentre(eleve.centreId, user, 'Élève non trouvé')
  }
  return prisma.document.findMany({
    where: { eleveId },
    orderBy: { createdAt: 'desc' }
  })
}

function getPrefix(type) {
  const map = {
    ATTESTATION_SCOLARITE: 'ATT',
    RELEVE_NOTES: 'RLV',
    RECU_PAIEMENT: 'REC',
    ATTESTATION_TRAVAIL: 'ATW',
    BULLETIN: 'BUL',
    FICHE_PAIE: 'PAI',
    AUTRE: 'DOC'
  }
  return map[type] || 'DOC'
}

const PDFDocument = require('pdfkit')
const { createBaseDocument, addFooter } = require('../../utils/pdf')
const { generateVerifyQr } = require('../../utils/qr')
const { generateAttestationScolarite, generateRecuPaiement, generateAttestationTravail } = require('../../utils/pdfDocuments')

async function generatePdf(id, user) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      eleve: {
        include: {
          utilisateur: true,
          classe: { include: { filiere: true } }
        }
      },
      personnel: { select: { centreId: true } },
      genereParUser: { select: { prenom: true, nom: true } }
    }
  })

  if (!doc) throw { statusCode: 404, message: 'Document non trouvé' }
  // Same isolation check as getById() above - this fetches independently
  // rather than reusing getById(), so it needs its own.
  const ownerCentreId = doc.eleve?.centreId ?? doc.personnel?.centreId
  if (ownerCentreId) assertSameCentre(ownerCentreId, user, 'Document non trouvé')

  // The document's own centre - was `prisma.centre.findFirst()`, which
  // always grabbed whichever centre happens to sort first regardless of
  // which one this document/élève/personnel actually belongs to. Went
  // unnoticed while every centre rendered an identical hardcoded header;
  // now that logo/couleurPrimaire are real per-centre branding (Sprint 6),
  // a Rabat document showing Casablanca's branding would be an obvious,
  // visible bug, not just a technicality.
  const documentCentreId = doc.eleve?.centreId || doc.personnel?.centreId
  const centre = documentCentreId
    ? await prisma.centre.findUnique({ where: { id: documentCentreId } })
    : await prisma.centre.findFirst()

  // The staff member an ATTESTATION_TRAVAIL is actually FOR - uses the
  // personnelId selected at creation time, same pattern as paiementId
  // below. Previously this looked up personnel by doc.generePar (whoever
  // clicked "générer"), which meant the attestation showed info about the
  // admin/secretary generating it instead of the employee it's supposed
  // to certify - a real bug, not just a missing filter.
  let personnel = null
  if (doc.type === 'ATTESTATION_TRAVAIL') {
    personnel = doc.personnelId
      ? await prisma.personnel.findUnique({
          where: { id: doc.personnelId },
          include: { utilisateur: true }
        })
      : await prisma.personnel.findFirst({
          where: { utilisateurId: doc.generePar },
          include: { utilisateur: true }
        })
  }
  // Use the paiement selected at document-creation time; fall back to
  // "latest paiement" only for documents created before paiementId existed
  // on this model (or if the admin left it unselected).
  let paiement = null
  if (doc.type === 'RECU_PAIEMENT') {
    paiement = doc.paiementId
      ? await prisma.paiementEleve.findUnique({ where: { id: doc.paiementId } })
      : await prisma.paiementEleve.findFirst({
          where: { eleveId: doc.eleveId },
          orderBy: { createdAt: 'desc' }
        })
  }
  const pdf = createBaseDocument(centre)

  switch (doc.type) {
    case 'ATTESTATION_SCOLARITE':
      generateAttestationScolarite(pdf, { eleve: doc.eleve, document: doc, centre })
      break
    case 'RECU_PAIEMENT':
      generateRecuPaiement(pdf, { eleve: doc.eleve, document: doc, centre, paiement })
      break
    case 'ATTESTATION_TRAVAIL':
      // No silent fallback to doc.eleve here anymore - it isn't shaped
      // like a Personnel record (no cin/poste/typeContrat/dateEmbauche),
      // so that fallback used to render a garbled PDF instead of failing
      // loudly. A document with no resolvable personnel is a real error.
      if (!personnel) {
        throw { statusCode: 422, message: 'Aucun personnel associé à cette attestation de travail' }
      }
      generateAttestationTravail(pdf, { personnel, document: doc, centre })
      break
    default:
      pdf.font('Helvetica').fontSize(12).text(`Document: ${doc.titre}`, { align: 'center' })
  }

  const qrBuffer = await generateVerifyQr(doc.numeroSerie)
  addFooter(pdf, doc.numeroSerie, qrBuffer)
  pdf.end()

  return { pdf, filename: `${doc.numeroSerie}.pdf` }
}

// Public (see documents.routes.js) - anyone who scans the QR code on a
// printed document hits this, so the response is deliberately minimal:
// enough to confirm the document is genuine without exposing full PII to
// whoever happens to have the piece of paper (or a photo of it). No
// eleveId/personnelId, no full names, no contact info.
async function verify(numeroSerie) {
  const doc = await prisma.document.findUnique({
    where: { numeroSerie },
    include: {
      eleve: { include: { utilisateur: { select: { prenom: true, nom: true } } } },
      personnel: { include: { utilisateur: { select: { prenom: true, nom: true } } } }
    }
  })
  if (!doc) return { valid: false }

  const target = doc.eleve?.utilisateur || doc.personnel?.utilisateur
  return {
    valid: true,
    type: doc.type,
    titre: doc.titre,
    numeroSerie: doc.numeroSerie,
    generatedAt: doc.createdAt,
    // First name + last-initial only - identifies the document without
    // publishing a full name to anyone who scans it.
    targetName: target ? `${target.prenom} ${target.nom.charAt(0)}.` : null
  }
}

module.exports = { getAll, getById, create, remove, getByEleve, generatePdf, verify }