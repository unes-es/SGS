const ctrl = require('./actualites.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize    = require('../../middlewares/authorize')

const idParamSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string', format: 'uuid' } }
  }
}

async function actualitesRoutes(fastify) {
  // public — landing page CMS feed, published items only
  fastify.register(async function publicRoutes(f) {
    f.get('/', ctrl.getPublic)
    f.get('/:id', { schema: idParamSchema }, ctrl.getPublicById)
  })

  // protected — staff CMS (SUPER_ADMIN/DIRECTEUR write, plus SECRETAIRE
  // read-only so the front-desk can see what's live without being able
  // to publish something unreviewed)
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

    f.post('/:id/image', {
      schema: idParamSchema,
      preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
    }, ctrl.updateImage)

    f.delete('/:id', {
      schema: idParamSchema,
      preHandler: authorize('SUPER_ADMIN')
    }, ctrl.remove)
  })
}

module.exports = actualitesRoutes
