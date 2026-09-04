const ctrl = require('./centres.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')

// :id columns are plain `String @default(uuid())`, not @db.Uuid, so a
// malformed id here was never actually crashing anything - Prisma just
// treats it as "no row matches" and the service's own 404 fires. This
// schema isn't fixing a live bug, it's making that intent explicit (a
// clean 400 instead of relying on incidental fallback-to-404 behavior)
// and closing the "no query validation on public routes" item in
// BACKLOG.md's Known Issues.
const idParamSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string', format: 'uuid' } }
  }
}

async function centresRoutes(fastify) {
  // public routes
  fastify.get('/',     ctrl.getAll)
  fastify.get('/:id', { schema: idParamSchema }, ctrl.getById)

  // protected routes
  fastify.get('/admin/all', { preHandler: [authenticate, authorize('SUPER_ADMIN')] }, ctrl.getAllAdmin)
  fastify.post('/',    { preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')] }, ctrl.create)
  fastify.put('/:id',  { preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')] }, ctrl.update)
  fastify.delete('/:id', { preHandler: [authenticate, authorize('SUPER_ADMIN')] }, ctrl.remove)
  fastify.post('/:id/logo', { preHandler: [authenticate, authorize('SUPER_ADMIN', 'DIRECTEUR')] }, ctrl.updateLogo)
}

module.exports = centresRoutes