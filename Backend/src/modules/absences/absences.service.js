const prisma = require('../../config/db')

async function getAll({ centreId, eleveId, classeId, dateDebut, dateFin, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit

  const where = {
    eleve: { centreId },
    ...(eleveId && { eleveId }),
    ...(classeId && { eleve: { centreId, classeId } }),
    ...(dateDebut && dateFin && {
      dateAbsence: {
        gte: new Date(dateDebut),
        lte: new Date(dateFin)
      }
    })
  }

  const [total, absences] = await Promise.all([
    prisma.absence.count({ where }),
    prisma.absence.findMany({
      where, skip, take: limit,
      orderBy: { dateAbsence: 'desc' },
      include: {
        eleve: {
          include: {
            utilisateur: { select: { prenom: true, nom: true } },
            classe: { select: { nom: true } }
          }
        },
        matiere: { select: { nom: true } },
        saisieParUser: { select: { prenom: true, nom: true } }
      }
    })
  ])

  return {
    data: absences,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}

async function getById(id) {
  const absence = await prisma.absence.findUnique({
    where: { id },
    include: {
      eleve: {
        include: { utilisateur: { select: { prenom: true, nom: true } } }
      },
      matiere: { select: { nom: true } },
      saisieParUser: { select: { prenom: true, nom: true } }
    }
  })
  if (!absence) throw { statusCode: 404, message: 'Absence non trouvée' }
  return absence
}

async function create(data, saisiePar) {
  return prisma.absence.create({
    data: {
      ...data,
      saisiePar,
      dateAbsence: new Date(data.dateAbsence)
    },
    include: {
      eleve: {
        include: { utilisateur: { select: { prenom: true, nom: true } } }
      },
      matiere: { select: { nom: true } }
    }
  })
}

async function justify(id, motif, justificatifUrl) {
  await getById(id)
  return prisma.absence.update({
    where: { id },
    data: { estJustifiee: true, motif, justificatifUrl }
  })
}

async function remove(id) {
  await getById(id)
  return prisma.absence.delete({ where: { id } })
}

async function getStats(centreId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [today_count, week_count, unjustified] = await Promise.all([
    prisma.absence.count({
      where: { eleve: { centreId }, dateAbsence: { gte: today } }
    }),
    prisma.absence.count({
      where: {
        eleve: { centreId },
        dateAbsence: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
      }
    }),
    prisma.absence.count({
      where: { eleve: { centreId }, estJustifiee: false }
    })
  ])

  return { today: today_count, thisWeek: week_count, unjustified }
}

module.exports = { getAll, getById, create, justify, remove, getStats }