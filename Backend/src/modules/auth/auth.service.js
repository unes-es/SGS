const bcrypt = require('bcrypt')
const prisma = require('../../config/db')

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

module.exports = { login, register, getMe }