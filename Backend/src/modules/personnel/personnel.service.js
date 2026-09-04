const prisma = require('../../config/db')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const authService = require('../auth/auth.service')
const { assertSameCentre } = require('../../utils/centreAccess')

// Login-capable staff roles this form may grant. Deliberately excludes
// SUPER_ADMIN (granting that stays a separate, deliberate action - not
// something that falls out of filling in a "poste" field) and the
// external self-service roles (PARENT/CANDIDAT/ETUDIANT), which aren't
// staff and are never created from this form.
const ASSIGNABLE_ROLES = ['DIRECTEUR', 'COMPTABLE', 'SECRETAIRE', 'PROFESSEUR']

async function getAll({ centreId, typeContrat, isActive = true, search, page = 1, limit = 15 }) {
  const skip = (page - 1) * limit

  const where = {
    centreId,
    isActive,
    ...(typeContrat && { typeContrat }),
    ...(search && {
      OR: [
        { utilisateur: { nom:    { contains: search, mode: 'insensitive' } } },
        { utilisateur: { prenom: { contains: search, mode: 'insensitive' } } },
        { utilisateur: { email:  { contains: search, mode: 'insensitive' } } },
        { poste:        { contains: search, mode: 'insensitive' } },
        { cin:          { contains: search, mode: 'insensitive' } },
      ]
    })
  }

  const [total, membres] = await Promise.all([
    prisma.personnel.count({ where }),
    prisma.personnel.findMany({
      where, skip, take: limit,
      include: {
        utilisateur: { select: { prenom: true, nom: true, email: true, telephone: true, role: true } },
        salaires: { orderBy: [{ annee: 'desc' }, { mois: 'desc' }], take: 3 }
      },
      orderBy: { createdAt: 'desc' }
    })
  ])

  return {
    data: membres,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}
async function getById(id, user) {
  const personnel = await prisma.personnel.findUnique({
    where: { id },
    include: {
      utilisateur: {
        select: { prenom: true, nom: true, email: true, telephone: true, role: true }
      },
      salaires: {
        orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
        take: 6
      }
    }
  })
  if (!personnel) throw { statusCode: 404, message: 'Personnel non trouvé' }
  assertSameCentre(personnel.centreId, user, 'Personnel non trouvé')
  return personnel
}

async function create(data, centreId) {
  // `role` (login access level) used to not exist on this form at all -
  // every hire got hardcoded to PROFESSEUR regardless of `poste`
  // (job title, free text - "Comptable", "Directrice", whatever the admin
  // typed), so an accountant or a director ended up with a professeur-
  // level login. Defaults to PROFESSEUR only for backward compatibility
  // with any caller that still doesn't send one.
  const { email, password, prenom, nom, telephone, role, ...personnelData } = data
  const assignedRole = ASSIGNABLE_ROLES.includes(role) ? role : 'PROFESSEUR'

  const exists = await prisma.utilisateur.findUnique({ where: { email } })
  if (exists) throw { statusCode: 409, message: 'Email déjà utilisé' }

  // A predictable fallback password ('sgs2026', same for every hire with
  // no password typed in) was the previous behavior here - anyone who
  // knew or guessed it could log into any staff account created without
  // an explicit password. Now: if the admin didn't set one, a random
  // password is generated (never surfaced anywhere) and the same
  // reset-token "set your password" email used elsewhere (Phase 2.2)
  // sends the new hire a real, single-use setup link instead.
  const rawPassword = password || crypto.randomBytes(24).toString('hex')
  const passwordHash = await bcrypt.hash(rawPassword, 12)

  // Same empty-string-vs-Decimal issue as update() below - the create
  // form sends these blank just as often (VACATAIRE hires with no
  // salaireBase, PERMANENT hires with no tauxHoraire).
  if (personnelData.salaireBase === '') personnelData.salaireBase = null
  if (personnelData.tauxHoraire === '') personnelData.tauxHoraire = null

  const personnel = await prisma.$transaction(async (tx) => {
    const user = await tx.utilisateur.create({
      data: {
        email, passwordHash, prenom, nom, telephone,
        centreId, role: assignedRole
      }
    })

    return tx.personnel.create({
      data: { ...personnelData, centreId, utilisateurId: user.id,
        dateEmbauche: new Date(personnelData.dateEmbauche)
      },
      include: {
        utilisateur: { select: { prenom: true, nom: true, email: true, role: true } }
      }
    })
  })

  // Same best-effort, never-block-the-real-operation pattern as the
  // welcome emails elsewhere (mailer.js / eleves.service.js / candidatures
  // .service.js) - only sent when the admin didn't set an explicit
  // password, since that's the only case where the new hire has no way
  // to know their password otherwise.
  if (!password) {
    try {
      const rawToken = await authService.issueResetToken(personnel.utilisateurId)
      await authService.sendResetEmail({ email, prenom }, rawToken, { purpose: 'welcome-staff' })
    } catch (err) {
      console.error('personnel welcome email failed:', err)
    }
  }

  return personnel
}

async function update(id, data, user) {
  await getById(id, user)
  const { prenom, nom, telephone, email, role, ...personnelData } = data

  return prisma.$transaction(async (tx) => {
    const p = await tx.personnel.findUnique({ where: { id } })

    if (prenom || nom || telephone || email || role) {
      const utilisateurData = {}
      if (prenom)    utilisateurData.prenom    = prenom
      if (nom)       utilisateurData.nom       = nom
      if (telephone) utilisateurData.telephone = telephone
      if (email)     utilisateurData.email     = email
      // Same allow-list as create() - an update body can't grant
      // SUPER_ADMIN or an external self-service role through this form
      // either. An invalid/omitted value just leaves the role untouched
      // rather than falling back to PROFESSEUR - unlike create(), there's
      // no sensible "default" here, only "don't change it".
      if (role && ASSIGNABLE_ROLES.includes(role)) utilisateurData.role = role

      await tx.utilisateur.update({
        where: { id: p.utilisateurId },
        data: utilisateurData
      })
    }

    // The edit form always sends salaireBase/tauxHoraire, blank or not -
    // Prisma's Decimal? fields reject an empty string outright ("Failed
    // to parse empty string. Expected decimal String"), which crashed
    // every edit of a record with either field left blank (VACATAIRE
    // staff have no salaireBase, PERMANENT staff often have no
    // tauxHoraire - this wasn't a rare edge case). "" -> null so an
    // intentionally-cleared field actually clears instead of 500ing.
    if (personnelData.salaireBase === '') personnelData.salaireBase = null
    if (personnelData.tauxHoraire === '') personnelData.tauxHoraire = null

    return tx.personnel.update({
      where: { id },
      data: {
        ...personnelData,
        ...(personnelData.dateEmbauche && {
          dateEmbauche: new Date(personnelData.dateEmbauche)
        })
      },
      include: {
        utilisateur: { select: { prenom: true, nom: true, email: true, role: true } }
      }
    })
  })
}

async function deactivate(id, user) {
  await getById(id, user)
  return prisma.$transaction(async (tx) => {
    const p = await tx.personnel.findUnique({ where: { id } })
    await tx.utilisateur.update({ where: { id: p.utilisateurId }, data: { isActive: false } })
    return tx.personnel.update({ where: { id }, data: { isActive: false } })
  })
}

module.exports = { getAll, getById, create, update, deactivate }