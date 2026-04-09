const ctrl = require('./caisse.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize    = require('../../middlewares/authorize')

async function caisseRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)

  // stats
  fastify.get('/stats', ctrl.getStats)

  // caisses
  fastify.get('/caisses',     ctrl.getAllCaisses)
  fastify.get('/caisses/:id', ctrl.getCaisseById)
  fastify.post('/caisses', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
  }, ctrl.createCaisse)

  // paiements
  fastify.get('/paiements',  ctrl.getAllPaiements)
  fastify.post('/paiements', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE', 'COMPTABLE')
  }, ctrl.createPaiement)

  // bons de caisse
  fastify.get('/bons',  ctrl.getAllBons)
  fastify.post('/bons', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'COMPTABLE')
  }, ctrl.createBon)

  fastify.get('/revenue-chart', ctrl.getRevenueChart)
}

module.exports = caisseRoutes