const service = require('./caisse.service')

module.exports = {
  // caisses
  async getAllCaisses(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    return { data: await service.getAllCaisses(centreId) }
  },
  async getCaisseById(req, reply) {
    return { data: await service.getCaisseById(req.params.id) }
  },
  async createCaisse(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.body.centreId || req.user.centreId
      : req.user.centreId
    const data = await service.createCaisse(req.body, centreId)
    return reply.status(201).send({ data })
  },

  // paiements
  async getAllPaiements(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    const { eleveId, caisseId, page, limit } = req.query
    return service.getAllPaiements({
      centreId, eleveId, caisseId,
      page: parseInt(page) || 1, limit: parseInt(limit) || 20
    })
  },
  async createPaiement(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.body.centreId || req.user.centreId
      : req.user.centreId
    const data = await service.createPaiement(req.body, req.user.id, centreId)
    return reply.status(201).send({ data })
  },

  // bons de caisse
  async getAllBons(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    const { caisseId, type, page, limit } = req.query
    return service.getAllBons({
      centreId, caisseId, type,
      page: parseInt(page) || 1, limit: parseInt(limit) || 20
    })
  },
  async createBon(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.body.centreId || req.user.centreId
      : req.user.centreId
    const data = await service.createBon(req.body, req.user.id, centreId)
    return reply.status(201).send({ data })
  },

  // stats
  async getStats(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    return { data: await service.getStats(centreId) }
  }
}