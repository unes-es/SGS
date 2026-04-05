const prisma = require('../../config/db')
const authenticate = require('../../middlewares/authenticate')
const authorize    = require('../../middlewares/authorize')

async function emploisRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/', async (req) => {
    const { classeId, professeurId } = req.query
    const data = await prisma.emploiDuTemps.findMany({
      where: {
        ...(classeId     && { classeId }),
        ...(professeurId && { professeurId })
      },
      include: {
        matiere:    { select: { nom: true } },
        classe:     { select: { nom: true } },
        professeur: { include: { utilisateur: { select: { prenom: true, nom: true } } } }
      },
      orderBy: [{ jourSemaine: 'asc' }, { heureDebut: 'asc' }]
    })
    return { data }
  })

  fastify.post('/', { preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE') },
    async (req) => {
      const data = await prisma.emploiDuTemps.create({
        data: req.body,
        include: {
          matiere:    { select: { nom: true } },
          classe:     { select: { nom: true } },
          professeur: { include: { utilisateur: { select: { prenom: true, nom: true } } } }
        }
      })
      return { data }
    }
  )

  fastify.delete('/:id', { preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR') },
    async (req) => {
      await prisma.emploiDuTemps.delete({ where: { id: req.params.id } })
      return { message: 'Supprimé' }
    }
  )
}

module.exports = emploisRoutes