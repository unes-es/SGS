const ctrl = require('./calendrier.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')

async function calendrierRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)

  // Any authenticated staff member can view the calendar - same
  // read-open / write-restricted shape as centres.routes.js.
  fastify.get('/', ctrl.getAll)
  fastify.get('/:id', ctrl.getById)

  fastify.post('/', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
  }, ctrl.create)

  fastify.put('/:id', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
  }, ctrl.update)

  fastify.delete('/:id', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
  }, ctrl.remove)
}

module.exports = calendrierRoutes
