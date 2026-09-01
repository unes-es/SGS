const ctrl = require('./filieres.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')
const prisma = require('../../config/db')

// See centres.routes.js's idParamSchema comment - same reasoning, same
// "not a live bug, closes the Known Issues item explicitly" scope.
const idParamSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string', format: 'uuid' } }
  }
}
const listQuerySchema = {
  querystring: {
    type: 'object',
    properties: { centreId: { type: 'string', format: 'uuid' } }
  }
}
const typeFormationParamSchema = {
  params: {
    type: 'object',
    required: ['id', 'typeFormation'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      typeFormation: { type: 'string', enum: ['JOUR', 'SOIR', 'WEEKEND', 'HYBRIDE', 'INTENSIF'] }
    }
  }
}

async function filieresRoutes(fastify) {
  // public routes
  fastify.get('/', { schema: listQuerySchema }, ctrl.getAll)
  fastify.get('/stats/eleves-par-filiere', {
    preHandler: authenticate
  }, ctrl.getElevesParFiliere)
  fastify.get('/:id', { schema: idParamSchema }, ctrl.getById)
  fastify.get('/:id/matieres', { schema: idParamSchema }, async (req, reply) => {
    const matieres = await prisma.matiere.findMany({
      where: { filiereId: req.params.id },
      orderBy: { nom: 'asc' }
    })
    return { data: matieres }
  })
  // Phase 2.3 Sprint 2 - public like the rest of this file's GETs, so a
  // future public pricing page could read it directly without auth.
  fastify.get('/:id/tarifs', { schema: idParamSchema }, ctrl.getTarifs)

  // protected routes
  fastify.post('/', { preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')] }, ctrl.create)
  fastify.put('/:id', { preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')] }, ctrl.update)
  fastify.delete('/:id', { preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')] }, ctrl.remove)
  fastify.put('/:id/tarifs/:typeFormation', {
    schema: typeFormationParamSchema,
    preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')]
  }, ctrl.upsertTarif)
  fastify.delete('/:id/tarifs/:typeFormation', {
    schema: typeFormationParamSchema,
    preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')]
  }, ctrl.removeTarif)
}

module.exports = filieresRoutes