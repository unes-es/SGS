const ctrl = require('./filieres.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')

async function filieresRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/',     ctrl.getAll)
  fastify.get('/:id',  ctrl.getById)
  fastify.post('/',    { preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR') }, ctrl.create)
  fastify.put('/:id',  { preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR') }, ctrl.update)
  fastify.delete('/:id', { preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR') }, ctrl.remove)
}

module.exports = filieresRoutes