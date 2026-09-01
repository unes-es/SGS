const prisma = require('../../config/db')
const { sendEmail, wrapEmail } = require('../../utils/mailer')

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

const STATUT_LABELS = {
  EN_ATTENTE: 'En attente',
  EN_COURS: "En cours d'étude",
  ACCEPTEE: 'Acceptée',
  REFUSEE: 'Refusée'
}

async function updateStatut(id, { statut, noteInterne }, traitePar) {
  const before = await getById(id)

  const updated = await prisma.candidature.update({
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

  // Log a timeline entry whenever the status actually changes (not on a
  // noteInterne-only edit) and best-effort notify the candidat by email -
  // same "never let a mailer hiccup fail the real operation" pattern as
  // linkCandidatAccount in create() below.
  if (statut && statut !== before.statut) {
    await prisma.candidatureEvenement.create({
      data: {
        candidatureId: id,
        type: 'STATUT_CHANGE',
        auteurId: traitePar,
        auteurRole: 'STAFF',
        message: `Statut changé de "${STATUT_LABELS[before.statut]}" à "${STATUT_LABELS[statut]}"`,
        ancienStatut: before.statut,
        nouveauStatut: statut
      }
    })

    if (updated.candidatUserId) {
      try {
        const candidatUser = await prisma.utilisateur.findUnique({ where: { id: updated.candidatUserId } })
        if (candidatUser) {
          await sendEmail({
            to: candidatUser.email,
            subject: `Votre candidature SGS — ${STATUT_LABELS[statut]}`,
            html: wrapEmail(
              'Mise à jour de votre candidature',
              `<p>Bonjour ${updated.prenom},</p><p>Le statut de votre candidature est maintenant : <strong>${STATUT_LABELS[statut]}</strong>.</p><p><a href="${process.env.FRONTEND_URL}/portail">Voir mon espace</a></p>`
            )
          })
        }
      } catch (err) {
        console.error('status-change email failed:', err)
      }
    }
  }

  return updated
}

// Shared by both the staff-facing (candidatures.routes.js) and candidat-
// facing (portal.routes.js) endpoints - the caller is responsible for
// authorizing *which* candidature the requester may touch (staff: any
// within their centre; candidat: only their own, enforced in
// portal.service.js), this function itself doesn't re-check that.
async function getDocuments(candidatureId) {
  return prisma.candidatureDocument.findMany({
    where: { candidatureId },
    orderBy: { createdAt: 'desc' }
  })
}

const fs = require('fs/promises')
const path = require('path')
const crypto = require('crypto')

const CANDIDATURE_UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'uploads', 'candidatures')
const ALLOWED_DOCUMENT_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'application/pdf': 'pdf'
}

async function addDocument(candidatureId, { type, buffer, mimetype, originalFilename }) {
  await getById(candidatureId)

  const ext = ALLOWED_DOCUMENT_TYPES[mimetype]
  if (!ext) {
    throw { statusCode: 400, message: 'Format non supporté (PNG, JPEG, WEBP ou PDF uniquement)' }
  }

  const filename = `${candidatureId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`
  await fs.mkdir(CANDIDATURE_UPLOADS_DIR, { recursive: true })
  await fs.writeFile(path.join(CANDIDATURE_UPLOADS_DIR, filename), buffer)

  return prisma.candidatureDocument.create({
    data: {
      candidatureId,
      type,
      nomFichier: originalFilename || filename,
      fichierUrl: `/uploads/candidatures/${filename}`
    }
  })
}

async function getEvenements(candidatureId) {
  return prisma.candidatureEvenement.findMany({
    where: { candidatureId },
    orderBy: { createdAt: 'asc' }
  })
}

async function addMessage(candidatureId, { message, auteurId, auteurRole }) {
  const candidature = await getById(candidatureId)

  const evenement = await prisma.candidatureEvenement.create({
    data: { candidatureId, type: 'MESSAGE', message, auteurId, auteurRole }
  })

  // Staff replying -> notify the candidat by email. Candidat messaging in
  // -> no email (staff sees it in the admin panel, an email per message
  // there would just be noise for an inbox they're already watching).
  if (auteurRole === 'STAFF' && candidature.candidatUserId) {
    try {
      const candidatUser = await prisma.utilisateur.findUnique({ where: { id: candidature.candidatUserId } })
      if (candidatUser) {
        await sendEmail({
          to: candidatUser.email,
          subject: 'Nouveau message du secrétariat SGS',
          html: wrapEmail(
            'Nouveau message',
            `<p>Bonjour ${candidature.prenom},</p><p>Le secrétariat vous a envoyé un message concernant votre candidature :</p><blockquote>${message}</blockquote><p><a href="${process.env.FRONTEND_URL}/portail">Voir mon espace</a></p>`
          )
        })
      }
    } catch (err) {
      console.error('message-notification email failed:', err)
    }
  }

  return evenement
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

module.exports = {
  getAll, getById, create, updateStatut, getStats,
  getDocuments, addDocument, getEvenements, addMessage
}