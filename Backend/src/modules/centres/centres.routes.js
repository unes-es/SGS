const ctrl = require('./centres.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')

async function centresRoutes(fastify) {
  // public routes
  fastify.get('/',     ctrl.getAll)
  fastify.get('/:id',  ctrl.getById)

  // protected routes
  fastify.post('/',    { preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')] }, ctrl.create)
  fastify.put('/:id',  { preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')] }, ctrl.update)
  fastify.delete('/:id', { preHandler: [authenticate, authorize('SUPER_ADMIN')] }, ctrl.remove)
}

module.exports = centresRoutes