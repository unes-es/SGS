const service = require('./absences.service')

module.exports = {
  async getAll(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    const { page, limit, eleveId, classeId, dateDebut, dateFin } = req.query
    return service.getAll({
      centreId, eleveId, classeId, dateDebut, dateFin,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    })
  },

  async getById(req, reply) {
    return { data: await service.getById(req.params.id) }
  },

  async create(req, reply) {
    const data = await service.create(req.body, req.user.id)
    return reply.status(201).send({ data })
  },

  async justify(req, reply) {
    const { motif, justificatifUrl } = req.body
    const data = await service.justify(req.params.id, motif, justificatifUrl)
    return { data }
  },

  async remove(req, reply) {
    await service.remove(req.params.id)
    return { message: 'Absence supprimée' }
  },

  async getStats(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    return { data: await service.getStats(centreId) }
  }
}