const prisma = require('../../config/db')
const { sendEmail, wrapEmail } = require('../../utils/mailer')
const authService = require('../auth/auth.service')
const { assertSameCentre } = require('../../utils/centreAccess')

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

async function getById(id, user) {
  const eleve = await prisma.eleve.findUnique({
    where: { id },
    include: {
      utilisateur: {
        select: { prenom: true, nom: true, email: true, telephone: true, photoUrl: true }
      },
      classe: {
        include: { filiere: true }
      },
      // Parent portal (feature addition) - so Eleves.jsx can show
      // whether a parent account is already linked, and to whom.
      parent: {
        select: { id: true, email: true, prenom: true, nom: true }
      }
    }
  })
  if (!eleve) throw { statusCode: 404, message: 'Élève non trouvé' }
  assertSameCentre(eleve.centreId, user, 'Élève non trouvé')
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

async function update(id, data, user) {
  await getById(id, user)
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

async function updateStatut(id, statut, user) {
  await getById(id, user)
  return prisma.eleve.update({ where: { id }, data: { statut } })
}

// ── Bulk import (feature addition) ──────────────────────────────────
//
// Deliberately reuses create() row-by-row rather than reimplementing
// matricule generation / account creation / welcome email - one code
// path for "how an élève gets created", whether that's the single-élève
// admin form or a spreadsheet of 100. Runs sequentially, not
// Promise.all, for two real reasons: generateMatricule() reads "the
// last matricule" and increments it, which would race and could hand
// out duplicate matricules under concurrency; and best not to fire 100+
// welcome emails at the mailer simultaneously.
//
// Expected columns (case/accent-insensitive, matched against the header
// row): Prenom, Nom, Email, Telephone, DateNaissance, Classe (exact nom,
// scoped to this centre), CIN, Adresse, NomParent, TelParent. Telephone/
// CIN/Adresse/NomParent/TelParent are optional; the rest are required.
const REQUIRED_COLUMNS = ['prenom', 'nom', 'email', 'datenaissance', 'classe']

function normalizeHeader(h) {
  return String(h || '')
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
}

async function importFromRows(rows, centreId) {
  // Resolve each row's "Classe" column (a name, the only thing an admin
  // filling a spreadsheet could reasonably know) to a classeId scoped to
  // this centre - never trust a row to name another centre's class.
  const classes = await prisma.classe.findMany({ where: { centreId }, select: { id: true, nom: true } })
  const classeByNom = new Map(classes.map(c => [c.nom.trim().toLowerCase(), c.id]))

  const results = []
  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2 // +1 for 0-index, +1 for the header row itself
    try {
      const missing = REQUIRED_COLUMNS.filter(col => !row[col] && row[col] !== 0)
      if (missing.length > 0) {
        throw new Error(`Colonne(s) manquante(s): ${missing.join(', ')}`)
      }

      const classeId = classeByNom.get(String(row.classe).trim().toLowerCase())
      if (!classeId) {
        throw new Error(`Classe "${row.classe}" introuvable dans ce centre`)
      }

      const dateNaissance = row.datenaissance instanceof Date
        ? row.datenaissance
        : new Date(row.datenaissance)
      if (Number.isNaN(dateNaissance.getTime())) {
        throw new Error(`Date de naissance invalide: "${row.datenaissance}"`)
      }

      const eleve = await create({
        prenom: String(row.prenom).trim(),
        nom: String(row.nom).trim(),
        email: String(row.email).trim().toLowerCase(),
        telephone: row.telephone ? String(row.telephone).trim() : null,
        classeId,
        dateNaissance: dateNaissance.toISOString(),
        cin: row.cin ? String(row.cin).trim() : null,
        adresse: row.adresse ? String(row.adresse).trim() : null,
        nomParent: row.nomparent ? String(row.nomparent).trim() : null,
        telParent: row.telparent ? String(row.telparent).trim() : null
      }, centreId)

      results.push({ row: rowNum, success: true, matricule: eleve.matricule, email: eleve.utilisateur.email })
    } catch (err) {
      results.push({ row: rowNum, success: false, error: err.message || 'Erreur inconnue' })
    }
  }

  return {
    total: results.length,
    imported: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  }
}

// ── Parent portal (feature addition) ────────────────────────────────
//
// Links a PARENT account to an existing élève. If a Utilisateur with
// this email already exists and has role PARENT, just links it (a
// second child for the same parent) - otherwise creates a new PARENT
// account. Rejects an email that belongs to a non-PARENT account
// (staff/candidat/etudiant) rather than silently repurposing it.
async function linkParent(eleveId, { email, prenom, nom, telephone }, user) {
  const eleve = await getById(eleveId, user)

  const normalizedEmail = email.trim().toLowerCase()
  let parentUser = await prisma.utilisateur.findUnique({ where: { email: normalizedEmail } })

  if (parentUser && parentUser.role !== 'PARENT') {
    throw { statusCode: 409, message: 'Cet email est déjà utilisé par un autre type de compte' }
  }

  if (!parentUser) {
    const bcrypt = require('bcrypt')
    const crypto = require('crypto')
    parentUser = await prisma.utilisateur.create({
      data: {
        email: normalizedEmail,
        prenom: prenom.trim(),
        nom: nom.trim(),
        telephone: telephone?.trim() || null,
        centreId: eleve.centreId,
        role: 'PARENT',
        // Random, never communicated directly - the welcome email below
        // carries a "set your password" link instead, same mechanism as
        // eleves.service.js's own welcome-eleve flow.
        passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12)
      }
    })

    try {
      const rawToken = await authService.issueResetToken(parentUser.id)
      await authService.sendResetEmail(parentUser, rawToken, { purpose: 'welcome-parent' })
    } catch (err) {
      console.error('parent welcome email failed:', err)
    }
  }

  await prisma.eleve.update({ where: { id: eleveId }, data: { parentUserId: parentUser.id } })

  return prisma.utilisateur.findUnique({
    where: { id: parentUser.id },
    select: { id: true, email: true, prenom: true, nom: true }
  })
}

async function unlinkParent(eleveId, user) {
  await getById(eleveId, user)
  await prisma.eleve.update({ where: { id: eleveId }, data: { parentUserId: null } })
  return { message: 'Parent délié' }
}

module.exports = {
  getAll, getById, create, update, updateStatut,
  importFromRows, linkParent, unlinkParent
}