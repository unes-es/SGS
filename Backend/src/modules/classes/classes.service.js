const prisma = require('../../config/db')
const { assertSameCentre } = require('../../utils/centreAccess')

async function getAll({ centreId, filiereId, typeFormation }) {
  return prisma.classe.findMany({
    where: {
      centreId,
      ...(filiereId && { filiereId }),
      ...(typeFormation && { typeFormation })
    },
    include: {
      filiere: { select: { nom: true, code: true } },
      _count:  { select: { eleves: true } }
    },
    orderBy: { nom: 'asc' }
  })
}

async function getById(id, user) {
  const classe = await prisma.classe.findUnique({
    where: { id },
    include: {
      filiere: true,
      eleves: {
        include: {
          utilisateur: { select: { prenom: true, nom: true, email: true } }
        }
      },
      emploisDuTemps: {
        include: {
          matiere:    { select: { nom: true } },
          professeur: { include: { utilisateur: { select: { prenom: true, nom: true } } } }
        }
      }
    }
  })
  if (!classe) throw { statusCode: 404, message: 'Classe non trouvée' }
  assertSameCentre(classe.centreId, user, 'Classe non trouvée')
  return classe
}

async function create(data, centreId) {
  return prisma.classe.create({
    data: { ...data, centreId },
    include: { filiere: { select: { nom: true } } }
  })
}

async function update(id, data, user) {
  await getById(id, user)
  return prisma.classe.update({ where: { id }, data })
}

async function remove(id, user) {
  const classe = await getById(id, user)
  const hasEleves = await prisma.eleve.count({ where: { classeId: id } })
  if (hasEleves > 0) {
    throw { statusCode: 400, message: 'Impossible de supprimer une classe avec des élèves' }
  }
  return prisma.classe.delete({ where: { id } })
}

module.exports = { getAll, getById, create, update, remove }