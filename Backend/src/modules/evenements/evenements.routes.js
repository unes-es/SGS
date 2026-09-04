const ctrl = require('./evenements.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize    = require('../../middlewares/authorize')

const idParamSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string', format: 'uuid' } }
  }
}

async function evenementsRoutes(fastify) {
  // public — landing page agenda, published + upcoming only
  fastify.register(async function publicRoutes(f) {
    f.get('/', ctrl.getPublic)
  })

  // protected — staff CMS
  fastify.register(async function protectedRoutes(f) {
    f.addHook('preHandler', authenticate)

    f.get('/admin/all', ctrl.getAllAdmin)
    f.get('/admin/:id', { schema: idParamSchema }, ctrl.getByIdAdmin)

    f.post('/', {
      preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
    }, ctrl.create)

    f.put('/:id', {
      schema: idParamSchema,
      preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
    }, ctrl.update)

    f.patch('/:id/publish', {
      schema: idParamSchema,
      preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
    }, ctrl.togglePublish)

    f.delete('/:id', {
      schema: idParamSchema,
      preHandler: authorize('SUPER_ADMIN')
    }, ctrl.remove)
  })
}

module.exports = evenementsRoutes
