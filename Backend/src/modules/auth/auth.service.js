const bcrypt = require('bcrypt')
const crypto = require('crypto')
const prisma = require('../../config/db')
const { sendEmail, wrapEmail } = require('../../utils/mailer')

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const RESET_TOKEN_TTL_MS = 48 * 60 * 60 * 1000 // 48h - long enough that a
// candidate who submits an application on a Friday evening isn't locked
// out by Monday, still bounded.

async function login({ email, password }) {
  const user = await prisma.utilisateur.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      centreId: true,
      prenom: true,
      nom: true,
      isActive: true
    }
  })

  if (!user || !user.isActive) {
    throw { statusCode: 401, message: 'Email ou mot de passe incorrect' }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    throw { statusCode: 401, message: 'Email ou mot de passe incorrect' }
  }

  // update last login
  await prisma.utilisateur.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  })

  const { passwordHash, ...userWithoutPassword } = user
  return userWithoutPassword
}

async function register({ email, password, role, prenom, nom, centreId, telephone }) {
  const exists = await prisma.utilisateur.findUnique({ where: { email } })
  if (exists) {
    throw { statusCode: 409, message: 'Email déjà utilisé' }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.utilisateur.create({
    data: { email, passwordHash, role, prenom, nom, centreId, telephone },
    select: {
      id: true, email: true, role: true,
      centreId: true, prenom: true, nom: true, createdAt: true
    }
  })

  return user
}

async function getMe(userId) {
  const user = await prisma.utilisateur.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, role: true,
      centreId: true, prenom: true, nom: true,
      telephone: true, photoUrl: true, lastLoginAt: true,
      centre: { select: { nom: true, ville: true } }
    }
  })

  if (!user) throw { statusCode: 404, message: 'Utilisateur non trouvé' }
  return user
}

// Self-service profile edit - every role (including CANDIDAT/ETUDIANT via
// the portal) can update their own prenom/nom/telephone/email. No role
// field here on purpose: unlike personnel.service.js's update() (an admin
// editing someone else's account), nothing here can change who this
// account is allowed to log in as - that stays an admin-only action.
async function updateMe(userId, { prenom, nom, telephone, email }) {
  if (email) {
    const exists = await prisma.utilisateur.findUnique({ where: { email } })
    if (exists && exists.id !== userId) {
      throw { statusCode: 409, message: 'Email déjà utilisé' }
    }
  }

  const user = await prisma.utilisateur.update({
    where: { id: userId },
    data: {
      ...(prenom !== undefined && { prenom }),
      ...(nom !== undefined && { nom }),
      ...(telephone !== undefined && { telephone }),
      ...(email !== undefined && { email })
    },
    select: {
      id: true, email: true, role: true,
      centreId: true, prenom: true, nom: true,
      telephone: true, photoUrl: true
    }
  })
  return user
}

// Distinct from resetPassword() (token-based, logged-out flow) - this is
// the in-session "I know my current password and want to change it" path,
// so it re-verifies the current password server-side rather than trusting
// the fact that the request carries a valid access token. A stolen-but-
// still-valid access token (e.g. from a shared/forgotten-logged-in
// browser) shouldn't be enough on its own to lock the real owner out.
async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.utilisateur.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true }
  })
  if (!user) throw { statusCode: 404, message: 'Utilisateur non trouvé' }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) throw { statusCode: 401, message: 'Mot de passe actuel incorrect' }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.utilisateur.update({
    where: { id: userId },
    data: { passwordHash }
  })
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Shared by "forgot password" and the initial "set your password" link a
// newly-created CANDIDAT gets (see candidatures.service.js) - both are the
// same underlying thing: issue a token, email a link, let them pick a
// password. `purpose` only changes the email copy.
async function issueResetToken(userId, { purpose = 'reset' } = {}) {
  const rawToken = crypto.randomBytes(32).toString('hex')
  await prisma.utilisateur.update({
    where: { id: userId },
    data: {
      resetTokenHash: hashToken(rawToken),
      resetTokenExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS)
    }
  })
  return rawToken
}

async function sendResetEmail(user, rawToken, { purpose = 'reset' } = {}) {
  const link = `${FRONTEND_URL}/reset-password/${rawToken}`
  const isFirstSet = purpose === 'welcome' || purpose === 'welcome-eleve' || purpose === 'welcome-staff'
  const title = isFirstSet ? 'Bienvenue sur SGS' : 'Réinitialisation de mot de passe'
  const intro = purpose === 'welcome-eleve'
    // Directly-enrolled élève with no prior CANDIDAT account behind it
    // (see eleves.service.js's create()) - the candidature-specific copy
    // below would be misleading here, there was no candidature.
    ? `Bonjour ${user.prenom}, votre inscription à SGS est confirmée. Cliquez ci-dessous pour créer votre mot de passe et accéder à votre espace élève.`
    : purpose === 'welcome-staff'
    // New hire (personnel.service.js) with no explicit password set by
    // the admin who created their account.
    ? `Bonjour ${user.prenom}, votre compte SGS a été créé. Cliquez ci-dessous pour choisir votre mot de passe et accéder à votre espace.`
    : purpose === 'welcome'
    ? `Bonjour ${user.prenom}, votre candidature a bien été enregistrée. Cliquez ci-dessous pour créer votre mot de passe et suivre son avancement.`
    : `Bonjour ${user.prenom}, cliquez ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans 48 heures.`

  await sendEmail({
    to: user.email,
    subject: title,
    html: wrapEmail(title, `
      <p>${intro}</p>
      <p><a href="${link}" style="display:inline-block;background:#1e40af;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">${isFirstSet ? 'Créer mon mot de passe' : 'Choisir un nouveau mot de passe'}</a></p>
      <p style="color:#94a3b8;font-size:12px;">Si le bouton ne fonctionne pas, copiez ce lien : ${link}</p>
    `)
  })
}

async function requestPasswordReset(email) {
  const user = await prisma.utilisateur.findUnique({ where: { email } })
  // Deliberately no error/distinction for "email not found" - responding
  // identically either way avoids letting this endpoint be used to probe
  // which emails have an SGS account (account enumeration).
  if (!user || !user.isActive) return

  const rawToken = await issueResetToken(user.id)
  await sendResetEmail(user, rawToken, { purpose: 'reset' })
}

async function resetPassword(token, newPassword) {
  const user = await prisma.utilisateur.findFirst({
    where: { resetTokenHash: hashToken(token) }
  })

  if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    throw { statusCode: 400, message: 'Lien invalide ou expiré' }
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.utilisateur.update({
    where: { id: user.id },
    data: { passwordHash, resetTokenHash: null, resetTokenExpires: null }
  })
}

module.exports = {
  login, register, getMe, updateMe, changePassword,
  issueResetToken, sendResetEmail,
  requestPasswordReset, resetPassword
}
