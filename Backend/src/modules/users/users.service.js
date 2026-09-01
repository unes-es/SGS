const prisma = require('../../config/db')

// Every login-capable account, staff and external self-service alike -
// the one thing Personnel/Eleve/Candidature admin pages each show a
// slice of, but nowhere shows the full picture (which is exactly the
// gap that prompted this module: "do we manage who can see what?").
// Never returns passwordHash/resetTokenHash - select is explicit below,
// not a blanket findMany, so a future field added to Utilisateur can't
// silently leak through here.
const SAFE_SELECT = {
  id: true, email: true, prenom: true, nom: true, telephone: true,
  role: true, isActive: true, lastLoginAt: true, createdAt: true,
  centreId: true,
  centre: { select: { nom: true } },
  personnel: { select: { poste: true } },
  eleve: { select: { matricule: true } }
}

const ALL_ROLES = ['SUPER_ADMIN', 'DIRECTEUR', 'COMPTABLE', 'SECRETAIRE', 'PROFESSEUR', 'PARENT', 'CANDIDAT', 'ETUDIANT']

async function getAll({ centreId, role, isActive, search, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit

  const where = {
    ...(centreId && { centreId }),
    ...(role && { role }),
    ...(isActive !== undefined && { isActive: isActive === 'false' ? false : true }),
    ...(search && {
      OR: [
        { prenom: { contains: search, mode: 'insensitive' } },
        { nom:    { contains: search, mode: 'insensitive' } },
        { email:  { contains: search, mode: 'insensitive' } }
      ]
    })
  }

  const [total, users] = await Promise.all([
    prisma.utilisateur.count({ where }),
    prisma.utilisateur.findMany({
      where, skip, take: limit,
      select: SAFE_SELECT,
      orderBy: { createdAt: 'desc' }
    })
  ])

  return { data: users, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
}

async function getStats(centreId) {
  const counts = await prisma.utilisateur.groupBy({
    by: ['role'],
    where: { centreId, isActive: true },
    _count: true
  })
  const byRole = Object.fromEntries(ALL_ROLES.map(r => [r, 0]))
  counts.forEach(c => { byRole[c.role] = c._count })
  return byRole
}

async function updateRole(id, role, actingUserId) {
  if (!ALL_ROLES.includes(role)) {
    throw { statusCode: 400, message: 'Rôle invalide' }
  }
  // Self-service accounts (CANDIDAT/ETUDIANT/PARENT) aren't granted here -
  // this page manages staff access levels; converting a CANDIDAT to
  // ETUDIANT is eleves.service.js's job (tied to an actual élève record
  // being created), not a free role edit that could desync the two.
  if (['CANDIDAT', 'ETUDIANT', 'PARENT'].includes(role)) {
    throw { statusCode: 400, message: 'Ce rôle ne peut pas être attribué depuis cette page' }
  }
  if (id === actingUserId) {
    throw { statusCode: 400, message: 'Vous ne pouvez pas modifier votre propre rôle' }
  }

  const user = await prisma.utilisateur.findUnique({ where: { id } })
  if (!user) throw { statusCode: 404, message: 'Utilisateur non trouvé' }
  if (['CANDIDAT', 'ETUDIANT', 'PARENT'].includes(user.role)) {
    throw { statusCode: 400, message: "Le rôle d'un compte candidat/élève/parent ne se change pas ici" }
  }

  return prisma.utilisateur.update({ where: { id }, data: { role }, select: SAFE_SELECT })
}

async function setActive(id, isActive, actingUserId) {
  if (id === actingUserId) {
    throw { statusCode: 400, message: 'Vous ne pouvez pas désactiver votre propre compte' }
  }
  const user = await prisma.utilisateur.findUnique({ where: { id } })
  if (!user) throw { statusCode: 404, message: 'Utilisateur non trouvé' }

  return prisma.utilisateur.update({ where: { id }, data: { isActive }, select: SAFE_SELECT })
}

module.exports = { getAll, getStats, updateRole, setActive }
