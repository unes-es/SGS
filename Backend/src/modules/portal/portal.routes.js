const ctrl = require('./portal.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')

async function portalRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)
  fastify.addHook('preHandler', authorize('CANDIDAT', 'ETUDIANT'))

  fastify.get('/candidature', ctrl.getMyCandidature)
  fastify.get('/eleve', ctrl.getMyEleve)

  // Sprint 2 (Phase 2.2) - document upload and the message/status feed,
  // scoped to the caller's own (most recent) candidature. See
  // portal.service.js for how that scoping is enforced.
  fastify.get('/candidature/documents',  ctrl.getMyDocuments)
  fastify.post('/candidature/documents', ctrl.addMyDocument)
  fastify.get('/candidature/evenements',  ctrl.getMyEvenements)
  fastify.post('/candidature/evenements', ctrl.addMyMessage)
}

module.exports = portalRoutes
