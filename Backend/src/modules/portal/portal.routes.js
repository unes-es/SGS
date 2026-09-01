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

  // Sprint 3 (Phase 2.2) - Student Portal, read-only. Each handler 404s
  // naturally for a CANDIDAT (no eleve record yet) via getMyEleve in
  // portal.service.js - no separate ETUDIANT-only check needed here.
  fastify.get('/eleve/notes',     ctrl.getMyNotes)
  fastify.get('/eleve/absences',  ctrl.getMyAbsences)
  fastify.get('/eleve/emploi',    ctrl.getMyEmploiDuTemps)
  fastify.get('/eleve/paiements', ctrl.getMyPaiements)
  fastify.get('/eleve/documents', ctrl.getMyEleveDocuments)
  // Deliberately its own scoped endpoint, not the staff /api/documents/:id/pdf
  // route reused - that route has no ownership check (fine there, only
  // ever called by authenticated staff who may fetch any élève's
  // document). getMyEleveDocumentPdf() in portal.service.js verifies the
  // document actually belongs to the caller's own eleve first.
  fastify.get('/eleve/documents/:id/pdf', ctrl.getMyEleveDocumentPdf)
}

module.exports = portalRoutes
