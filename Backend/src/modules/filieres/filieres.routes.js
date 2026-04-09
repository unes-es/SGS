const ctrl = require('./filieres.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')
const prisma = require('../../config/db')

async function filieresRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/', ctrl.getAll)
  fastify.get('/stats/eleves-par-filiere', ctrl.getElevesParFiliere)
  fastify.get('/:id', ctrl.getById)
  fastify.post('/', { preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR') }, ctrl.create)
  fastify.put('/:id', { preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR') }, ctrl.update)
  fastify.delete('/:id', { preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR') }, ctrl.remove)
  fastify.get('/:id/matieres', async (req, reply) => {
    const matieres = await prisma.matiere.findMany({
      where: { filiereId: req.params.id },
      orderBy: { nom: 'asc' }
    })
    return { data: matieres }
  })
}


module.exports = filieresRoutes