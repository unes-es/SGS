const ctrl = require('./eleves.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')

async function elevesRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/',     ctrl.getAll)
  fastify.get('/:id',  ctrl.getById)

  fastify.post('/', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE')
  }, ctrl.create)

  fastify.put('/:id', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE')
  }, ctrl.update)

  fastify.patch('/:id/statut', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
  }, ctrl.updateStatut)

  // Bulk import (feature addition) - same roles as create(), since this
  // is create() run many times over.
  fastify.post('/import', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE')
  }, ctrl.import)

  // Parent portal (feature addition)
  fastify.post('/:id/parent', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE')
  }, ctrl.linkParent)
  fastify.delete('/:id/parent', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE')
  }, ctrl.unlinkParent)
}

module.exports = elevesRoutes