const prisma = require('../../config/db')

async function getAll({ centreId, statut, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit

  const where = {
    centreId,
    ...(statut && { statut })
  }

  const [total, candidatures] = await Promise.all([
    prisma.candidature.count({ where }),
    prisma.candidature.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        filiere:       { select: { nom: true } },
        traiteParUser: { select: { prenom: true, nom: true } }
      }
    })
  ])

  return {
    data: candidatures,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}

async function getById(id) {
  const c = await prisma.candidature.findUnique({
    where: { id },
    include: {
      filiere:       { select: { nom: true, code: true } },
      centre:        { select: { nom: true, ville: true } },
      traiteParUser: { select: { prenom: true, nom: true } }
    }
  })
  if (!c) throw { statusCode: 404, message: 'Candidature non trouvée' }
  return c
}

async function create(data) {
  return prisma.candidature.create({
    data: {
      ...data,
      ...(data.dateNaissance && { dateNaissance: new Date(data.dateNaissance) })
    }
  })
}

async function updateStatut(id, { statut, noteInterne }, traitePar) {
  await getById(id)
  return prisma.candidature.update({
    where: { id },
    data: {
      statut,
      ...(noteInterne !== undefined && { noteInterne }),
      traitePar,
      traiteAt: new Date()
    },
    include: {
      filiere:       { select: { nom: true } },
      traiteParUser: { select: { prenom: true, nom: true } }
    }
  })
}

async function getStats(centreId) {
  const [total, enAttente, acceptees, refusees, enCours] = await Promise.all([
    prisma.candidature.count({ where: { centreId } }),
    prisma.candidature.count({ where: { centreId, statut: 'EN_ATTENTE' } }),
    prisma.candidature.count({ where: { centreId, statut: 'ACCEPTEE' } }),
    prisma.candidature.count({ where: { centreId, statut: 'REFUSEE' } }),
    prisma.candidature.count({ where: { centreId, statut: 'EN_COURS' } }),
  ])
  return { total, enAttente, acceptees, refusees, enCours }
}

const notifService = require('../notifications/notifications.service')

async function create(data) {
  const candidature = await prisma.candidature.create({
    data: {
      ...data,
      ...(data.dateNaissance && { dateNaissance: new Date(data.dateNaissance) })
    }
  })

  // broadcast notification to staff
  await notifService.createBroadcast({
    centreId: data.centreId,
    type:     'CANDIDATURE',
    titre:    'Nouvelle candidature reçue',
    message:  `${data.prenom} ${data.nom} a soumis une candidature${data.filiereId ? '' : ''}.`,
    link:     '/admin/candidatures'
  })

  return candidature
}

module.exports = { getAll, getById, create, updateStatut, getStats }