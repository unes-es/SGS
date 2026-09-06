const prisma = require('../../config/db')

// Academic calendar (feature addition) - internal staff calendar, not
// public (unlike Evenement/Actualite, no isPublished concept here).
// centreId nullable = applies to both campuses, same convention as
// Evenement - see evenements.service.js.

async function getAll({ centreId, from, to } = {}) {
  const where = {
    ...(centreId ? { OR: [{ centreId }, { centreId: null }] } : {}),
    ...(from || to ? {
      // Overlap, not containment: an entry that started before `from`
      // but ends after it should still show up, same as any calendar
      // range query.
      dateDebut: to ? { lte: new Date(to) } : undefined,
      dateFin: from ? { gte: new Date(from) } : undefined
    } : {})
  }
  return prisma.evenementCalendrier.findMany({
    where,
    orderBy: { dateDebut: 'asc' },
    include: { centre: { select: { nom: true } } }
  })
}

async function getById(id) {
  const evt = await prisma.evenementCalendrier.findUnique({
    where: { id },
    include: { centre: { select: { nom: true } } }
  })
  if (!evt) throw { statusCode: 404, message: 'Événement non trouvé' }
  return evt
}

async function create(data) {
  const { type, titre, dateDebut, dateFin, centreId } = data
  if (!type || !titre || !dateDebut || !dateFin) {
    throw { statusCode: 400, message: 'type, titre, dateDebut et dateFin sont requis' }
  }
  const debut = new Date(dateDebut)
  const fin = new Date(dateFin)
  if (fin < debut) {
    throw { statusCode: 400, message: 'La date de fin doit être postérieure à la date de début' }
  }
  return prisma.evenementCalendrier.create({
    data: { type, titre, dateDebut: debut, dateFin: fin, centreId: centreId || null }
  })
}

async function update(id, data) {
  await getById(id)
  const { type, titre, dateDebut, dateFin, centreId } = data
  return prisma.evenementCalendrier.update({
    where: { id },
    data: {
      ...(type !== undefined && { type }),
      ...(titre !== undefined && { titre }),
      ...(dateDebut !== undefined && { dateDebut: new Date(dateDebut) }),
      ...(dateFin !== undefined && { dateFin: new Date(dateFin) }),
      ...(centreId !== undefined && { centreId: centreId || null })
    }
  })
}

async function remove(id) {
  await getById(id)
  return prisma.evenementCalendrier.delete({ where: { id } })
}

module.exports = { getAll, getById, create, update, remove }
