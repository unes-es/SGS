const ctrl         = require('./notifications.controller')
const authenticate = require('../../middlewares/authenticate')

async function notificationsRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/',              ctrl.getAll)
  fastify.patch('/:id/read',    ctrl.markRead)
  fastify.patch('/read-all',    ctrl.markAllRead)
}

module.exports = notificationsRoutes