const ctrl = require('./filieres.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')
const prisma = require('../../config/db')

async function filieresRoutes(fastify) {
  // public routes
  fastify.get('/', ctrl.getAll)
  fastify.get('/stats/eleves-par-filiere', {
    preHandler: authenticate
  }, ctrl.getElevesParFiliere)
  fastify.get('/:id', ctrl.getById)
  fastify.get('/:id/matieres', async (req, reply) => {
    const matieres = await prisma.matiere.findMany({
      where: { filiereId: req.params.id },
      orderBy: { nom: 'asc' }
    })
    return { data: matieres }
  })

  // protected routes
  fastify.post('/', { preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')] }, ctrl.create)
  fastify.put('/:id', { preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')] }, ctrl.update)
  fastify.delete('/:id', { preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')] }, ctrl.remove)
}

module.exports = filieresRoutes