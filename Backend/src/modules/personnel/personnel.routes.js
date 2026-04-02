const ctrl = require('./personnel.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize    = require('../../middlewares/authorize')

async function personnelRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/',     ctrl.getAll)
  fastify.get('/:id',  ctrl.getById)

  fastify.post('/', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
  }, ctrl.create)

  fastify.put('/:id', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
  }, ctrl.update)

  fastify.delete('/:id', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
  }, ctrl.deactivate)
}

module.exports = personnelRoutes