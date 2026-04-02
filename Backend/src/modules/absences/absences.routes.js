const ctrl = require('./absences.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')

async function absencesRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/',        ctrl.getAll)
  fastify.get('/stats',   ctrl.getStats)
  fastify.get('/:id',     ctrl.getById)

  fastify.post('/', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE', 'PROFESSEUR')
  }, ctrl.create)

  fastify.patch('/:id/justify', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE')
  }, ctrl.justify)

  fastify.delete('/:id', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
  }, ctrl.remove)
}

module.exports = absencesRoutes