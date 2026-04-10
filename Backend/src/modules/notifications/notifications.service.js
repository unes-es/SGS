const prisma = require('../../config/db')

async function getAll({ centreId, userId, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit

  const where = {
    centreId,
    OR: [
      { userId },
      { userId: null } // broadcast
    ]
  }

  const [total, unread, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, isRead: false } }),
    prisma.notification.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' }
    })
  ])

  return {
    data: notifications,
    meta: { total, unread, page, limit, totalPages: Math.ceil(total / limit) }
  }
}

async function markRead(id, userId) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true }
  })
}

async function markAllRead({ centreId, userId }) {
  return prisma.notification.updateMany({
    where: {
      centreId,
      isRead: false,
      OR: [{ userId }, { userId: null }]
    },
    data: { isRead: true }
  })
}

async function create({ centreId, userId, type, titre, message, link }) {
  return prisma.notification.create({
    data: { centreId, userId, type, titre, message, link }
  })
}

async function createBroadcast({ centreId, type, titre, message, link }) {
  return prisma.notification.create({
    data: { centreId, userId: null, type, titre, message, link }
  })
}

// ── CRON JOBS ─────────────────────────────────────

async function checkImpayés() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear  = now.getFullYear()

  // find all active élèves without scolarité payment this month
  const impayés = await prisma.eleve.findMany({
    where: {
      statut: 'ACTIF',
      paiements: {
        none: {
          typeFrais:   'SCOLARITE',
          periodeMois: currentMonth,
          periodeAnnee: currentYear
        }
      }
    },
    include: {
      utilisateur: { select: { prenom: true, nom: true } },
      classe:      { select: { nom: true, centreId: true } }
    }
  })

  // group by centre
  const byCentre = {}
  for (const e of impayés) {
    const cid = e.centreId
    if (!byCentre[cid]) byCentre[cid] = []
    byCentre[cid].push(e)
  }

  // create one broadcast notification per centre
  for (const [centreId, eleves] of Object.entries(byCentre)) {
    // check if we already sent this notification today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existing = await prisma.notification.findFirst({
      where: {
        centreId,
        type: 'IMPAYES',
        createdAt: { gte: today }
      }
    })

    if (!existing) {
      await createBroadcast({
        centreId,
        type:    'IMPAYES',
        titre:   `${eleves.length} élève(s) avec scolarité impayée`,
        message: `${eleves.length} élève(s) n'ont pas encore réglé leur scolarité de ${currentMonth}/${currentYear}.`,
        link:    '/admin/caisse'
      })
    }
  }
}

module.exports = {
  getAll, markRead, markAllRead,
  create, createBroadcast, checkImpayés
}