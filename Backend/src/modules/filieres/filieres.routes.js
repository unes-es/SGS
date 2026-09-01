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
  // Phase 2.3 Sprint 2 - public like the rest of this file's GETs, so a
  // future public pricing page could read it directly without auth.
  fastify.get('/:id/tarifs', ctrl.getTarifs)

  // protected routes
  fastify.post('/', { preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')] }, ctrl.create)
  fastify.put('/:id', { preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')] }, ctrl.update)
  fastify.delete('/:id', { preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')] }, ctrl.remove)
  fastify.put('/:id/tarifs/:typeFormation', {
    preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')]
  }, ctrl.upsertTarif)
  fastify.delete('/:id/tarifs/:typeFormation', {
    preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')]
  }, ctrl.removeTarif)
}

module.exports = filieresRoutes