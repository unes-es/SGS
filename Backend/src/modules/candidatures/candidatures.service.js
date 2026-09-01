const prisma = require('../../config/db')

async function getAll({ centreId, statut, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit

  const where = {
    centreId,
    ...(statut && { statut })
  }

  const [total, candidatures] = await Promise.all([
    prisma.candidature.count({ where }),
    prisma.candidature.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        filiere:       { select: { nom: true } },
        traiteParUser: { select: { prenom: true, nom: true } }
      }
    })
  ])

  return {
    data: candidatures,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}

async function getById(id) {
  const c = await prisma.candidature.findUnique({
    where: { id },
    include: {
      filiere:       { select: { nom: true, code: true } },
      centre:        { select: { nom: true, ville: true } },
      traiteParUser: { select: { prenom: true, nom: true } }
    }
  })
  if (!c) throw { statusCode: 404, message: 'Candidature non trouvée' }
  return c
}

async function updateStatut(id, { statut, noteInterne }, traitePar) {
  await getById(id)
  return prisma.candidature.update({
    where: { id },
    data: {
      statut,
      ...(noteInterne !== undefined && { noteInterne }),
      traitePar,
      traiteAt: new Date()
    },
    include: {
      filiere:       { select: { nom: true } },
      traiteParUser: { select: { prenom: true, nom: true } }
    }
  })
}

async function getStats(centreId) {
  const [total, enAttente, acceptees, refusees, enCours] = await Promise.all([
    prisma.candidature.count({ where: { centreId } }),
    prisma.candidature.count({ where: { centreId, statut: 'EN_ATTENTE' } }),
    prisma.candidature.count({ where: { centreId, statut: 'ACCEPTEE' } }),
    prisma.candidature.count({ where: { centreId, statut: 'REFUSEE' } }),
    prisma.candidature.count({ where: { centreId, statut: 'EN_COURS' } }),
  ])
  return { total, enAttente, acceptees, refusees, enCours }
}

const notifService = require('../notifications/notifications.service')
const authService = require('../auth/auth.service')
const bcrypt = require('bcrypt')

// Auto-creates (or reuses) the CANDIDAT account tied to a candidature
// (Phase 2.2). Returns the linked Utilisateur id, or null if account
// creation was deliberately skipped.
async function linkCandidatAccount({ email, prenom, nom, telephone, centreId }) {
  const existing = await prisma.utilisateur.findUnique({ where: { email } })

  if (!existing) {
    // Random, never-communicated password - the account is only usable
    // once the candidate follows the "set your password" email link
    // (issueResetToken/sendResetEmail), same reset-token mechanism as
    // forgot-password, just framed as a welcome email instead.
    const passwordHash = await bcrypt.hash(require('crypto').randomBytes(32).toString('hex'), 12)
    const user = await prisma.utilisateur.create({
      data: { email, passwordHash, role: 'CANDIDAT', prenom, nom, telephone, centreId }
    })
    const rawToken = await authService.issueResetToken(user.id)
    await authService.sendResetEmail(user, rawToken, { purpose: 'welcome' })
    return user.id
  }

  // Reapplying with the same account (e.g. a previous year) - just link
  // to it, no new email.
  if (existing.role === 'CANDIDAT' || existing.role === 'ETUDIANT') {
    return existing.id
  }

  // The email already belongs to a staff/PARENT account - don't create a
  // duplicate, and don't error out the public submission either (that
  // would leak whether an email has an SGS account). The candidature
  // still saves fine, just with no linked candidat account.
  return null
}

async function create(data) {
  // POST /candidatures/public has no auth guard (both the public landing
  // page form AND the admin's own "manual candidature" modal call this
  // exact endpoint - see candidatures.routes.js) - so `data` here is
  // unauthenticated user input. Only whitelist fields a candidate is
  // actually meant to set; without this, a raw POST could set `statut`
  // (e.g. straight to ACCEPTEE), `noteInterne`, `traitePar`, or `traiteAt`
  // directly, bypassing the admin review flow entirely. Defense in depth
  // alongside the route's own `additionalProperties: false` schema (see
  // candidatures.routes.js) - that schema is the one actually stopping a
  // raw request today, but a whitelist at the point data actually reaches
  // Prisma is still worth having regardless of what happens upstream.
  //
  // NOTE: this used to live in a second, separate `create()` declared
  // later in this same file - a leftover duplicate that silently shadowed
  // this one at runtime (later function declaration wins), so this
  // whitelist was dead code from the moment it was written until this
  // merge. Verified with `node -e "console.log(require(...).create)"`
  // before touching anything, since this is exactly the kind of thing
  // easy to get wrong by assuming rather than checking.
  const {
    prenom, nom, email, telephone, dateNaissance,
    adresse, nomParent, telParent, message,
    centreId, filiereId
  } = data

  // Best-effort: a mailer/account hiccup should never be why a
  // candidature submission itself fails - the admin can always follow up
  // manually if this silently didn't happen.
  let candidatUserId = null
  try {
    candidatUserId = await linkCandidatAccount({ email, prenom, nom, telephone, centreId })
  } catch (err) {
    console.error('linkCandidatAccount failed:', err)
  }

  const candidature = await prisma.candidature.create({
    data: {
      prenom, nom, email, telephone,
      adresse, nomParent, telParent, message,
      centreId, filiereId, candidatUserId,
      ...(dateNaissance && { dateNaissance: new Date(dateNaissance) })
    }
  })

  // broadcast notification to staff
  await notifService.createBroadcast({
    centreId,
    type:     'CANDIDATURE',
    titre:    'Nouvelle candidature reçue',
    message:  `${prenom} ${nom} a soumis une candidature${filiereId ? '' : ''}.`,
    link:     '/admin/candidatures'
  })

  return candidature
}

module.exports = { getAll, getById, create, updateStatut, getStats }