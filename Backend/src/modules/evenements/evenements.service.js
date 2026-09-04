const prisma = require('../../config/db')

// Public site only shows published, upcoming (or today's) events, soonest
// first - matches the old hardcoded EVENTS array's intent (an "agenda",
// not an archive). Past events stay in the DB for admin history but drop
// out of the public feed automatically once dateDebut passes.
async function getPublic({ centreId, limit = 10 } = {}) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const where = {
    isPublished: true,
    dateDebut: { gte: startOfToday },
    ...(centreId ? { OR: [{ centreId }, { centreId: null }] } : {})
  }
  return prisma.evenement.findMany({
    where,
    orderBy: { dateDebut: 'asc' },
    take: Number(limit),
    include: { centre: { select: { nom: true } } }
  })
}

async function getAllAdmin({ centreId, page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit
  const where = centreId ? { OR: [{ centreId }, { centreId: null }] } : {}
  const [total, data] = await Promise.all([
    prisma.evenement.count({ where }),
    prisma.evenement.findMany({
      where, skip, take: Number(limit),
      orderBy: { dateDebut: 'desc' },
      include: { centre: { select: { nom: true } } }
    })
  ])
  return { data, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } }
}

async function getByIdAdmin(id) {
  const evt = await prisma.evenement.findUnique({
    where: { id },
    include: { centre: { select: { nom: true } } }
  })
  if (!evt) throw { statusCode: 404, message: 'Événement non trouvé' }
  return evt
}

async function create(data) {
  const { type, titre, description, lieu, dateDebut, dateFin, centreId, isPublished } = data
  return prisma.evenement.create({
    data: {
      type, titre, description, lieu,
      dateDebut: new Date(dateDebut),
      dateFin: dateFin ? new Date(dateFin) : null,
      centreId: centreId || null,
      isPublished: !!isPublished
    }
  })
}

async function update(id, data) {
  await getByIdAdmin(id)
  const { type, titre, description, lieu, dateDebut, dateFin, centreId, isPublished } = data
  return prisma.evenement.update({
    where: { id },
    data: {
      ...(type !== undefined && { type }),
      ...(titre !== undefined && { titre }),
      ...(description !== undefined && { description }),
      ...(lieu !== undefined && { lieu }),
      ...(dateDebut !== undefined && { dateDebut: new Date(dateDebut) }),
      ...(dateFin !== undefined && { dateFin: dateFin ? new Date(dateFin) : null }),
      ...(centreId !== undefined && { centreId: centreId || null }),
      ...(isPublished !== undefined && { isPublished })
    }
  })
}

async function togglePublish(id) {
  const existing = await getByIdAdmin(id)
  return prisma.evenement.update({
    where: { id },
    data: { isPublished: !existing.isPublished }
  })
}

async function remove(id) {
  await getByIdAdmin(id)
  return prisma.evenement.delete({ where: { id } })
}

module.exports = { getPublic, getAllAdmin, getByIdAdmin, create, update, togglePublish, remove }
