const ctrl = require('./documents.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')

async function documentsRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/', ctrl.getAll)

  fastify.get('/:id/pdf', ctrl.generatePdf)

  fastify.get('/:id', ctrl.getById)
  fastify.get('/eleve/:eleveId', ctrl.getByEleve)

  fastify.post('/', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE')
  }, ctrl.create)

  fastify.delete('/:id', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
  }, ctrl.remove)

}

module.exports = documentsRoutes