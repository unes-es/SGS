const prisma = require('../../config/db')

async function getAll(centreId) {
  return prisma.filiere.findMany({
    where: { centreId, isActive: true },
    include: {
      _count: { select: { classes: true, matieres: true } }
    },
    orderBy: { nom: 'asc' }
  })
}

async function getById(id) {
  const filiere = await prisma.filiere.findUnique({
    where: { id },
    include: {
      classes: true,
      matieres: { orderBy: { nom: 'asc' } }
    }
  })
  if (!filiere) throw { statusCode: 404, message: 'Filière non trouvée' }
  return filiere
}

async function create(data, centreId) {
  const exists = await prisma.filiere.findUnique({ where: { code: data.code } })
  if (exists) throw { statusCode: 409, message: 'Code filière déjà utilisé' }
  return prisma.filiere.create({ data: { ...data,dureeMois: parseInt(data.dureeMois), centreId } })
}

async function update(id, data) {
  await getById(id)
  return prisma.filiere.update({ where: { id }, data })
}

async function remove(id) {
  await getById(id)
  return prisma.filiere.update({ where: { id }, data: { isActive: false } })
}

async function getElevesParFiliere(centreId) {
  const filieres = await prisma.filiere.findMany({
    where: { centreId, isActive: true },
    include: {
      classes: {
        include: { _count: { select: { eleves: true } } }
      }
    }
  })

  return filieres.map(f => ({
    nom: f.nom,
    eleves: f.classes.reduce((s, c) => s + c._count.eleves, 0)
  })).filter(f => f.eleves > 0)
}

module.exports = { getAll, getById, create, update, remove, getElevesParFiliere }