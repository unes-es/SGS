const ctrl         = require('./rapports.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize    = require('../../middlewares/authorize')

async function rapportsRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/financier',     ctrl.getRapportFinancier)
  fastify.get('/presence',      ctrl.getTauxPresence)
  fastify.get('/reussite',      ctrl.getTauxReussite)
  fastify.get('/export-fec',    ctrl.exportFEC)
  fastify.get('/formats',       ctrl.getStatsFormats)
}

module.exports = rapportsRoutes