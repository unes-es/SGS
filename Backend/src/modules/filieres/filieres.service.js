const prisma = require('../../config/db')
const { assertSameCentre } = require('../../utils/centreAccess')

async function getAll(centreId) {
  return prisma.filiere.findMany({
    where: { centreId, isActive: true },
    include: {
      _count: { select: { classes: true, matieres: true } }
    },
    orderBy: { nom: 'asc' }
  })
}

// `user` is optional and deliberately unused on the public path -
// filieres.routes.js's GET /:id has no auth at all (the landing page
// reads filière info directly), so there's no caller centre to check
// against there. Every protected write below passes it, though.
async function getById(id, user) {
  const filiere = await prisma.filiere.findUnique({
    where: { id },
    include: {
      classes: true,
      matieres: { orderBy: { nom: 'asc' } }
    }
  })
  if (!filiere) throw { statusCode: 404, message: 'Filière non trouvée' }
  assertSameCentre(filiere.centreId, user, 'Filière non trouvée')
  return filiere
}

async function create(data, centreId) {
  const exists = await prisma.filiere.findUnique({ where: { code: data.code } })
  if (exists) throw { statusCode: 409, message: 'Code filière déjà utilisé' }
  return prisma.filiere.create({ data: { ...data,dureeMois: parseInt(data.dureeMois), centreId } })
}

async function update(id, data, user) {
  await getById(id, user)
  return prisma.filiere.update({ where: { id }, data })
}

async function remove(id, user) {
  await getById(id, user)
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

// Phase 2.3 Sprint 2 - per-(filiere, format) tarif overrides. See the
// FormationTarif model comment in schema.prisma: a missing row for a
// given format just means "no override, use the filiere's own
// fraisScolarite" - getTarifs() below makes that fallback explicit
// rather than leaving the frontend to figure it out.
async function getTarifs(filiereId) {
  const filiere = await getById(filiereId)
  const overrides = await prisma.formationTarif.findMany({ where: { filiereId } })
  const overrideByType = Object.fromEntries(overrides.map(o => [o.typeFormation, o]))

  return ['JOUR', 'SOIR', 'WEEKEND', 'HYBRIDE', 'INTENSIF'].map(typeFormation => ({
    typeFormation,
    fraisScolarite: overrideByType[typeFormation]?.fraisScolarite ?? filiere.fraisScolarite,
    isOverride: !!overrideByType[typeFormation]
  }))
}

async function upsertTarif(filiereId, typeFormation, fraisScolarite, user) {
  await getById(filiereId, user)
  return prisma.formationTarif.upsert({
    where: { filiereId_typeFormation: { filiereId, typeFormation } },
    create: { filiereId, typeFormation, fraisScolarite },
    update: { fraisScolarite }
  })
}

// Deleting the override just reverts that format back to the filiere's
// own fraisScolarite - not an error if there was no override to begin
// with (idempotent "reset to default"). Still centre-checked first, same
// as upsertTarif - only getById() throws, so the check has to happen
// before the (otherwise unconditional) deleteMany.
async function removeTarif(filiereId, typeFormation, user) {
  await getById(filiereId, user)
  await prisma.formationTarif.deleteMany({ where: { filiereId, typeFormation } })
}

module.exports = {
  getAll, getById, create, update, remove, getElevesParFiliere,
  getTarifs, upsertTarif, removeTarif
}