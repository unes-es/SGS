const ctrl = require('./centres.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')

async function centresRoutes(fastify) {
  // all routes require login
  fastify.addHook('preHandler', authenticate)

  fastify.get('/',     ctrl.getAll)
  fastify.get('/:id',  ctrl.getById)

  // only SUPER_ADMIN and DIRECTEUR can create/edit/delete
  fastify.post('/',    { preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR') }, ctrl.create)
  fastify.put('/:id',  { preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR') }, ctrl.update)
  fastify.delete('/:id', { preHandler: authorize('SUPER_ADMIN') }, ctrl.remove)
}

module.exports = centresRoutes