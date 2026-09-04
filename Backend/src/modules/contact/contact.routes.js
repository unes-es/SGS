const ctrl = require('./contact.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize    = require('../../middlewares/authorize')

// Same reasoning as candidatures/public: no auth guard, called directly
// from the public landing page, so schema validation + a hard
// additionalProperties: false is the only defense on this endpoint.
const createSchema = {
  body: {
    type: 'object',
    required: ['prenom', 'nom', 'email', 'sujet', 'message'],
    additionalProperties: false,
    properties: {
      prenom:    { type: 'string', minLength: 1, maxLength: 100 },
      nom:       { type: 'string', minLength: 1, maxLength: 100 },
      email:     { type: 'string', format: 'email', maxLength: 255 },
      telephone: { type: 'string', maxLength: 30 },
      sujet:     { type: 'string', minLength: 1, maxLength: 200 },
      message:   { type: 'string', minLength: 1, maxLength: 2000 }
    }
  }
}

const idParamSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string', format: 'uuid' } }
  }
}

async function contactRoutes(fastify) {
  // public — the landing page's Contact form
  fastify.register(async function publicRoutes(f) {
    f.post('/', { schema: createSchema }, ctrl.create)
  })

  // protected — staff inbox
  fastify.register(async function protectedRoutes(f) {
    f.addHook('preHandler', authenticate)
    f.addHook('preHandler', authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE'))

    f.get('/', ctrl.getAll)
    f.patch('/:id/traiter', { schema: idParamSchema }, ctrl.marquerTraite)
  })
}

module.exports = contactRoutes
