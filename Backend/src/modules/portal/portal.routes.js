const ctrl = require('./portal.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')

async function portalRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)
  fastify.addHook('preHandler', authorize('CANDIDAT', 'ETUDIANT'))

  fastify.get('/candidature', ctrl.getMyCandidature)
  fastify.get('/eleve', ctrl.getMyEleve)
}

module.exports = portalRoutes
