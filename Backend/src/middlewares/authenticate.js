const prisma = require('../config/db')

async function authenticate(req, reply) {
  try {
    await req.jwtVerify()
    
    const user = await prisma.utilisateur.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        role: true,
        centreId: true,
        isActive: true,
        prenom: true,
        nom: true
      }
    })

    if (!user || !user.isActive) {
      return reply.status(401).send({ message: 'Unauthorized' })
    }

    req.user = user
  } catch (err) {
    reply.status(401).send({ message: 'Invalid token' })
  }
}

module.exports = authenticate