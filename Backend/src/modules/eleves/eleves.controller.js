    const service = require('./eleves.service')

module.exports = {
  async getAll(req, reply) {
    const { page, limit, search, statut, classeId } = req.query
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId
      : req.user.centreId

    const result = await service.getAll({
      centreId,
      page:     parseInt(page)  || 1,
      limit:    parseInt(limit) || 20,
      search,
      statut,
      classeId
    })
    return result
  },

  async getById(req, reply) {
    const data = await service.getById(req.params.id)
    return { data }
  },

  async create(req, reply) {
  const centreId = req.user.role === 'SUPER_ADMIN'
    ? (req.body.centreId || req.user.centreId)
    : req.user.centreId

  if (!centreId) {
    return reply.status(400).send({ success: false, message: 'centreId requis' })
  }

  const data = await service.create(req.body, centreId)
  return reply.status(201).send({ data })
  },

  async update(req, reply) {
    const data = await service.update(req.params.id, req.body)
    return { data }
  },

  async updateStatut(req, reply) {
    const data = await service.updateStatut(req.params.id, req.body.statut)
    return { data }
  }
}