const ctrl = require('./matieres.controller')
const authenticate = require('../../middlewares/authenticate')

async function matieresRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/', ctrl.getAll)
  fastify.post('/', ctrl.create)
  fastify.put('/:id', ctrl.update)
  fastify.delete('/:id', ctrl.remove)
}

module.exports = matieresRoutes
