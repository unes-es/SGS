const prisma = require('../../config/db')

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

async function getById(id) {
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
      genereParUser: { select: { prenom: true, nom: true } }
    }
  })
  if (!doc) throw { statusCode: 404, message: 'Document non trouvé' }
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
      fichierUrl: data.fichierUrl || `/documents/${numeroSerie}.pdf`
    },
    include: {
      eleve: {
        include: {
          utilisateur: { select: { prenom: true, nom: true } }
        }
      },
      genereParUser: { select: { prenom: true, nom: true } }
    }
  })
}

async function remove(id) {
  await getById(id)
  return prisma.document.delete({ where: { id } })
}

async function getByEleve(eleveId) {
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
const { generateAttestationScolarite, generateRecuPaiement, generateAttestationTravail } = require('../../utils/pdfDocuments')

async function generatePdf(id) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      eleve: {
        include: {
          utilisateur: true,
          classe: { include: { filiere: true } }
        }
      },
      genereParUser: { select: { prenom: true, nom: true } }
    }
  })

  if (!doc) throw { statusCode: 404, message: 'Document non trouvé' }

  // get centre info
  const centre = await prisma.centre.findFirst()

  // get personnel if attestation travail
  let personnel = null
  if (doc.type === 'ATTESTATION_TRAVAIL') {
    personnel = await prisma.personnel.findFirst({
      where: { utilisateurId: doc.generePar },
      include: { utilisateur: true }
    })
  }
  // get latest paiement if recu
  let paiement = null
  if (doc.type === 'RECU_PAIEMENT') {
    paiement = await prisma.paiementEleve.findFirst({
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
      generateAttestationTravail(pdf, { personnel: personnel || doc.eleve, document: doc, centre })
      break
    default:
      pdf.font('Helvetica').fontSize(12).text(`Document: ${doc.titre}`, { align: 'center' })
  }

  addFooter(pdf, doc.numeroSerie)
  pdf.end()

  return { pdf, filename: `${doc.numeroSerie}.pdf` }
}

module.exports = { getAll, getById, create, remove, getByEleve, generatePdf }