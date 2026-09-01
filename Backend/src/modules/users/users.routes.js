const ctrl = require('./users.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')

const idParamSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string', format: 'uuid' } }
  }
}

async function usersRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)

  // Viewing is open to SUPER_ADMIN and DIRECTEUR (same pair that already
  // manages Personnel) - granting a role or deactivating a login is
  // SUPER_ADMIN-only below, deliberately narrower than viewing.
  fastify.addHook('preHandler', authorize('SUPER_ADMIN', 'DIRECTEUR'))

  fastify.get('/',      ctrl.getAll)
  fastify.get('/stats', ctrl.getStats)

  fastify.patch('/:id/role', {
    schema: idParamSchema,
    preHandler: authorize('SUPER_ADMIN')
  }, ctrl.updateRole)

  fastify.patch('/:id/active', {
    schema: idParamSchema,
    preHandler: authorize('SUPER_ADMIN')
  }, ctrl.setActive)
}

module.exports = usersRoutes
