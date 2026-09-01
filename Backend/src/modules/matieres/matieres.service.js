const prisma = require('../../config/db')

async function getAll({ filiereId } = {}) {
  return prisma.matiere.findMany({
    where: { ...(filiereId && { filiereId }) },
    orderBy: { nom: 'asc' }
  })
}

async function create(data) {
  const { nom, code, coefficient, volumeHoraire, estOptionnelle, filiereId } = data

  return prisma.matiere.create({
    data: {
      nom,
      code: code || '',
      coefficient: parseInt(coefficient) || 1,
      volumeHoraire: volumeHoraire ? parseInt(volumeHoraire) : null,
      estOptionnelle: Boolean(estOptionnelle),
      filiereId
    }
  })
}

async function update(id, data) {
  return prisma.matiere.update({ where: { id }, data })
}

async function remove(id) {
  await prisma.matiere.delete({ where: { id } })
}

module.exports = { getAll, create, update, remove }
