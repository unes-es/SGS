const prisma = require('../../config/db')

async function getAll({ centreId, personnelId, mois, annee, statut }) {
  return prisma.salaire.findMany({
    where: {
      centreId,
      ...(personnelId && { personnelId }),
      ...(mois        && { mois: parseInt(mois) }),
      ...(annee       && { annee: parseInt(annee) }),
      ...(statut      && { statut })
    },
    include: {
      personnel: {
        include: {
          utilisateur: { select: { prenom: true, nom: true } }
        }
      }
    },
    orderBy: [{ annee: 'desc' }, { mois: 'desc' }]
  })
}

async function getById(id) {
  const salaire = await prisma.salaire.findUnique({
    where: { id },
    include: {
      personnel: {
        include: {
          utilisateur: { select: { prenom: true, nom: true } }
        }
      }
    }
  })
  if (!salaire) throw { statusCode: 404, message: 'Salaire non trouvé' }
  return salaire
}

async function create(data, centreId) {
  // check not already created for same personnel/mois/annee
  const exists = await prisma.salaire.findFirst({
    where: {
      personnelId: data.personnelId,
      mois: parseInt(data.mois),
      annee: parseInt(data.annee)
    }
  })
  if (exists) throw { statusCode: 409, message: 'Salaire déjà créé pour cette période' }

  return prisma.salaire.create({
    data: {
      ...data,
      centreId,
      mois:         parseInt(data.mois),
      annee:        parseInt(data.annee),
      montantBrut:  parseFloat(data.montantBrut),
      deductions:   parseFloat(data.deductions  || 0),
      montantNet:   parseFloat(data.montantNet),
      ...(data.datePaiement && { datePaiement: new Date(data.datePaiement) })
    },
    include: {
      personnel: {
        include: { utilisateur: { select: { prenom: true, nom: true } } }
      }
    }
  })
}

async function payer(id, { modePaiement, datePaiement }) {
  await getById(id)
  return prisma.salaire.update({
    where: { id },
    data: {
      statut: 'PAYE',
      modePaiement,
      datePaiement: datePaiement ? new Date(datePaiement) : new Date()
    }
  })
}

async function getStats({ centreId, mois, annee }) {
  const salaires = await prisma.salaire.findMany({
    where: { centreId, mois: parseInt(mois), annee: parseInt(annee) }
  })

  const total     = salaires.reduce((s, x) => s + parseFloat(x.montantNet), 0)
  const paye      = salaires.filter(s => s.statut === 'PAYE').reduce((s, x) => s + parseFloat(x.montantNet), 0)
  const enAttente = salaires.filter(s => s.statut === 'EN_ATTENTE').reduce((s, x) => s + parseFloat(x.montantNet), 0)

  return {
    total, paye, enAttente,
    nbTotal:     salaires.length,
    nbPayes:     salaires.filter(s => s.statut === 'PAYE').length,
    nbEnAttente: salaires.filter(s => s.statut === 'EN_ATTENTE').length
  }
}

module.exports = { getAll, getById, create, payer, getStats }