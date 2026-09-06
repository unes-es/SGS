const service = require('./calendrier.service')

module.exports = {
  async getAll(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId
      : req.user.centreId
    const { from, to } = req.query
    return { data: await service.getAll({ centreId, from, to }) }
  },

  async getById(req, reply) {
    return { data: await service.getById(req.params.id) }
  },

  async create(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? (req.body.centreId || null)
      : req.user.centreId
    const data = await service.create({ ...req.body, centreId })
    return reply.status(201).send({ data })
  },

  async update(req, reply) {
    const data = await service.update(req.params.id, req.body)
    return { data }
  },

  async remove(req, reply) {
    await service.remove(req.params.id)
    return { message: 'Événement supprimé' }
  }
}
