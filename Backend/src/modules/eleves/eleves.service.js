const prisma = require('../../config/db')
const { sendEmail, wrapEmail } = require('../../utils/mailer')
const authService = require('../auth/auth.service')

// auto-generate matricule like MAT-2026-0001
async function generateMatricule() {
  const year = new Date().getFullYear()
  const last = await prisma.eleve.findFirst({
    where: { matricule: { startsWith: `MAT-${year}` } },
    orderBy: { matricule: 'desc' }
  })
  const next = last ? parseInt(last.matricule.split('-')[2]) + 1 : 1
  return `MAT-${year}-${String(next).padStart(4, '0')}`
}

async function getAll({ centreId, page = 1, limit = 20, search, statut, classeId }) {
  const skip = (page - 1) * limit

  const where = {
    centreId,
    ...(statut && { statut }),
    ...(classeId && { classeId }),
    ...(search && {
      OR: [
        { matricule: { contains: search, mode: 'insensitive' } },
        { utilisateur: { nom:    { contains: search, mode: 'insensitive' } } },
        { utilisateur: { prenom: { contains: search, mode: 'insensitive' } } },
        { utilisateur: { email:  { contains: search, mode: 'insensitive' } } }
      ]
    })
  }

  const [total, eleves] = await Promise.all([
    prisma.eleve.count({ where }),
    prisma.eleve.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        utilisateur: {
          select: { prenom: true, nom: true, email: true, telephone: true }
        },
        classe: {
          select: { nom: true, filiere: { select: { nom: true } } }
        }
      }
    })
  ])

  return {
    data: eleves,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}

async function getById(id) {
  const eleve = await prisma.eleve.findUnique({
    where: { id },
    include: {
      utilisateur: {
        select: { prenom: true, nom: true, email: true, telephone: true, photoUrl: true }
      },
      classe: {
        include: { filiere: true }
      }
    }
  })
  if (!eleve) throw { statusCode: 404, message: 'Élève non trouvé' }
  return eleve
}

async function create(data, centreId) {
  // candidatureId (Phase 2.2): when this élève is being created by
  // ConvertirEleveModal from an accepted candidature, the candidature
  // already has a CANDIDAT Utilisateur account linked to it (auto-created
  // on submission - see candidatures.service.js). That account should
  // become this élève's account (converted to ETUDIANT), not be silently
  // abandoned in favor of a brand new duplicate one - the whole point is
  // one continuous account/login across the admissions-to-enrollment
  // lifecycle. Not passed at all for a directly-created élève with no
  // candidature behind it.
  const { email, password, prenom, nom, telephone, candidatureId, ...eleveData } = data
  const bcrypt = require('bcrypt')

  let linkedCandidatUserId = null
  if (candidatureId) {
    const candidature = await prisma.candidature.findUnique({
      where: { id: candidatureId },
      select: { candidatUserId: true }
    })
    linkedCandidatUserId = candidature?.candidatUserId || null
  }

  const exists = await prisma.utilisateur.findUnique({ where: { email } })
  // A match is only an error if it's a DIFFERENT account than the one
  // we're about to reuse - finding the candidate's own account by its own
  // email is expected, not a conflict.
  if (exists && exists.id !== linkedCandidatUserId) {
    throw { statusCode: 409, message: 'Email déjà utilisé' }
  }

  const matricule = await generateMatricule()

  const result = await prisma.$transaction(async (tx) => {
    const user = linkedCandidatUserId
      ? await tx.utilisateur.update({
          where: { id: linkedCandidatUserId },
          // Refresh with whatever the admin confirmed/corrected in the
          // conversion form, and promote the role - everything else
          // (passwordHash, resetTokenHash if a "set password" email was
          // never followed) is left untouched.
          data: { email, prenom, nom, telephone, centreId, role: 'ETUDIANT' }
        })
      : await tx.utilisateur.create({
          data: {
            email, prenom, nom, telephone, centreId,
            role: 'ETUDIANT',
            passwordHash: await bcrypt.hash(password || matricule, 12)
          }
        })

    const eleve = await tx.eleve.create({
    data: {
        ...eleveData,
        matricule,
        centreId,
        utilisateurId: user.id,
        dateInscription: new Date(),
        dateNaissance: new Date(eleveData.dateNaissance)  // add this
    },
    include: {
        utilisateur: { select: { prenom: true, nom: true, email: true } }
    }
    })

    return eleve
  })

  // Welcome email (Sprint 4, Phase 2.2) - best-effort, never blocks the
  // élève record from being created over a mailer hiccup, same pattern as
  // every other email send in this codebase (see mailer.js/candidatures
  // .service.js).
  try {
    if (linkedCandidatUserId) {
      // Already has a working password from their CANDIDAT account - a
      // "set your password" link would be wrong here, they don't need
      // one. Just tell them they're enrolled.
      await sendEmail({
        to: email,
        subject: 'Bienvenue à SGS — votre inscription est confirmée',
        html: wrapEmail(
          'Inscription confirmée',
          `<p>Bonjour ${prenom},</p><p>Votre inscription est confirmée. Votre matricule est <strong>${matricule}</strong>.</p><p>Connectez-vous avec vos identifiants habituels sur <a href="${process.env.FRONTEND_URL}/candidat/login">votre espace</a> pour suivre vos notes, absences et paiements.</p>`
        )
      })
    } else {
      // Brand new account, no prior CANDIDAT password to reuse - same
      // "set your password" token mechanism as linkCandidatAccount's
      // welcome email in candidatures.service.js, just framed for a
      // directly-created élève instead.
      const rawToken = await authService.issueResetToken(result.utilisateurId)
      await authService.sendResetEmail(
        { email, prenom },
        rawToken,
        { purpose: 'welcome-eleve' }
      )
    }
  } catch (err) {
    console.error('eleve welcome email failed:', err)
  }

  return result
}

async function update(id, data) {
  await getById(id)
  const { prenom, nom, telephone, email, ...eleveData } = data

  return prisma.$transaction(async (tx) => {
    const eleve = await tx.eleve.findUnique({ where: { id } })

    if (prenom || nom || telephone || email) {
      await tx.utilisateur.update({
        where: { id: eleve.utilisateurId },
        data: { prenom, nom, telephone, email }
      })
    }

    return tx.eleve.update({
    where: { id },
    data: {
        ...eleveData,
        ...(eleveData.dateNaissance && { 
        dateNaissance: new Date(eleveData.dateNaissance) 
        })
    },
    include: {
        utilisateur: { select: { prenom: true, nom: true, email: true } }
    }
    })
  })
}

async function updateStatut(id, statut) {
  await getById(id)
  return prisma.eleve.update({ where: { id }, data: { statut } })
}

module.exports = { getAll, getById, create, update, updateStatut }