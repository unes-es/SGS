const ctrl = require('./salaires.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize    = require('../../middlewares/authorize')

async function salairesRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/',        ctrl.getAll)
  fastify.get('/stats',   ctrl.getStats)
  fastify.get('/:id',     ctrl.getById)

  fastify.post('/', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'COMPTABLE')
  }, ctrl.create)

  fastify.patch('/:id/payer', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'COMPTABLE')
  }, ctrl.payer)
}

module.exports = salairesRoutes