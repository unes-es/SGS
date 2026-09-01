const ctrl = require('./candidatures.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize    = require('../../middlewares/authorize')

// This endpoint has no auth guard - both the public landing-page form and
// the admin's own "manual candidature" modal call it (see
// candidaturesApi.create in frontend/src/api/candidatures.js). Schema
// validation is the first line of defense; candidatures.service.js's
// create() also whitelists fields server-side as a second one, since
// `additionalProperties: false` here only rejects the *request* - it
// doesn't stop `create()` from being called with a wider object by some
// future internal caller.
const createSchema = {
  body: {
    type: 'object',
    required: ['prenom', 'nom', 'email', 'centreId'],
    additionalProperties: false,
    properties: {
      prenom:        { type: 'string', minLength: 1, maxLength: 100 },
      nom:           { type: 'string', minLength: 1, maxLength: 100 },
      email:         { type: 'string', format: 'email', maxLength: 255 },
      telephone:     { type: 'string', maxLength: 30 },
      dateNaissance: { type: 'string', format: 'date' },
      adresse:       { type: 'string', maxLength: 500 },
      nomParent:     { type: 'string', maxLength: 100 },
      telParent:     { type: 'string', maxLength: 30 },
      message:       { type: 'string', maxLength: 2000 },
      centreId:      { type: 'string', format: 'uuid' },
      filiereId:     { type: 'string', format: 'uuid' }
    }
  }
}

async function candidaturesRoutes(fastify) {
  // public route — registered in isolated scope without auth hook
  fastify.register(async function publicRoutes(f) {
    f.post('/public', { schema: createSchema }, ctrl.create)
  })

  // protected routes — scoped with auth hook
  fastify.register(async function protectedRoutes(f) {
    f.addHook('preHandler', authenticate)
    f.get('/stats',      ctrl.getStats)
    f.get('/',           ctrl.getAll)
    f.get('/:id',        ctrl.getById)
    f.patch('/:id/statut', {
      preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE')
    }, ctrl.updateStatut)

    // Sprint 2 (Phase 2.2) - candidat-uploaded documents and the
    // message/status-timeline feed, staff side. Candidat side is the
    // mirror of these under /api/portal (see portal.routes.js), scoped to
    // the caller's own candidature there instead of an :id param.
    f.get('/:id/documents',  ctrl.getDocuments)
    f.post('/:id/documents', {
      preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE')
    }, ctrl.addDocument)
    f.get('/:id/evenements',  ctrl.getEvenements)
    f.post('/:id/evenements', {
      preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE')
    }, ctrl.addMessage)
  })
}

module.exports = candidaturesRoutes