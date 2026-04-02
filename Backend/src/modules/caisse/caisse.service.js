const prisma = require('../../config/db')

// ── CAISSES ──────────────────────────────────────

async function getAllCaisses(centreId) {
  return prisma.caisse.findMany({
    where: { centreId, isActive: true },
    include: { _count: { select: { paiements: true, bonsCaisse: true } } }
  })
}

async function getCaisseById(id) {
  const caisse = await prisma.caisse.findUnique({
    where: { id },
    include: { _count: { select: { paiements: true, bonsCaisse: true } } }
  })
  if (!caisse) throw { statusCode: 404, message: 'Caisse non trouvée' }
  return caisse
}

async function createCaisse(data, centreId) {
  return prisma.caisse.create({ data: { ...data, centreId } })
}

// ── PAIEMENTS ─────────────────────────────────────

async function getAllPaiements({ centreId, eleveId, caisseId, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit

  const where = {
    caisse: { centreId },
    ...(eleveId  && { eleveId }),
    ...(caisseId && { caisseId })
  }

  const [total, paiements] = await Promise.all([
    prisma.paiementEleve.count({ where }),
    prisma.paiementEleve.findMany({
      where, skip, take: limit,
      orderBy: { datePaiement: 'desc' },
      include: {
        eleve: {
          include: {
            utilisateur: { select: { prenom: true, nom: true } }
          }
        },
        caisse:           { select: { nom: true } },
        encaisseParUser:  { select: { prenom: true, nom: true } }
      }
    })
  ])

  return {
    data: paiements,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}

async function createPaiement(data, encaissePar, centreId) {
  // generate reference
  const count = await prisma.paiementEleve.count()
  const reference = `REC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const paiement = await prisma.paiementEleve.create({
    data: {
      ...data,
      encaissePar,
      reference,
      datePaiement: new Date(data.datePaiement || new Date()),
      montant: parseFloat(data.montant),
      ...(data.periodeMois  && { periodeMois:  parseInt(data.periodeMois) }),
      ...(data.periodeAnnee && { periodeAnnee: parseInt(data.periodeAnnee) })
    },
    include: {
      eleve:   { include: { utilisateur: { select: { prenom: true, nom: true } } } },
      caisse:  { select: { nom: true } }
    }
  })

  // update caisse solde
  await prisma.caisse.update({
    where: { id: data.caisseId },
    data:  { soldeActuel: { increment: parseFloat(data.montant) } }
  })

  return paiement
}

// ── BONS DE CAISSE ────────────────────────────────

async function getAllBons({ centreId, caisseId, type, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit

  const where = {
    caisse: { centreId },
    ...(caisseId && { caisseId }),
    ...(type     && { type })
  }

  const [total, bons] = await Promise.all([
    prisma.bonCaisse.count({ where }),
    prisma.bonCaisse.findMany({
      where, skip, take: limit,
      orderBy: { dateOperation: 'desc' },
      include: {
        caisse:      { select: { nom: true } },
        creeParUser: { select: { prenom: true, nom: true } }
      }
    })
  ])

  return {
    data: bons,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}

async function createBon(data, creePar, centreId) {
  const count  = await prisma.bonCaisse.count()
  const numero = `BC-${String(count + 1).padStart(4, '0')}`

  const bon = await prisma.bonCaisse.create({
    data: {
      ...data,
      creePar,
      numero,
      montant:       parseFloat(data.montant),
      dateOperation: new Date(data.dateOperation || new Date())
    },
    include: {
      caisse:      { select: { nom: true } },
      creeParUser: { select: { prenom: true, nom: true } }
    }
  })

  // update caisse solde
  const delta = data.type === 'ENTREE'
    ? parseFloat(data.montant)
    : -parseFloat(data.montant)

  await prisma.caisse.update({
    where: { id: data.caisseId },
    data:  { soldeActuel: { increment: delta } }
  })

  return bon
}

// ── STATS ─────────────────────────────────────────

async function getStats(centreId) {
  const caisses = await prisma.caisse.findMany({
    where: { centreId, isActive: true },
    select: { soldeActuel: true }
  })

  const soldeTotal = caisses.reduce((s, c) => s + parseFloat(c.soldeActuel), 0)

  const now       = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [entresMois, sortiesMois, impayesCount] = await Promise.all([
    prisma.paiementEleve.aggregate({
      where: { caisse: { centreId }, datePaiement: { gte: startMonth } },
      _sum: { montant: true }
    }),
    prisma.bonCaisse.aggregate({
      where: { caisse: { centreId }, type: 'SORTIE', dateOperation: { gte: startMonth } },
      _sum: { montant: true }
    }),
    prisma.eleve.count({
      where: {
        centreId, statut: 'ACTIF',
        paiements: { none: {
          typeFrais: 'SCOLARITE',
          periodeAnnee: now.getFullYear(),
          periodeMois: now.getMonth() + 1
        }}
      }
    })
  ])

  return {
    soldeTotal,
    entresMois:  parseFloat(entresMois._sum.montant  || 0),
    sortiesMois: parseFloat(sortiesMois._sum.montant || 0),
    impayesCount
  }
}

module.exports = {
  getAllCaisses, getCaisseById, createCaisse,
  getAllPaiements, createPaiement,
  getAllBons, createBon,
  getStats
}