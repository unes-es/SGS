const service = require('./filieres.service')

module.exports = {
  async getAll(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    return { data: await service.getAll(centreId) }
  },
  async getById(req, reply) {
    return { data: await service.getById(req.params.id) }
  },
  async create(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.body.centreId || req.user.centreId
      : req.user.centreId
    const data = await service.create(req.body, centreId)
    return reply.status(201).send({ data })
  },
  async update(req, reply) {
    return { data: await service.update(req.params.id, req.body) }
  },
  async remove(req, reply) {
    await service.remove(req.params.id)
    return { message: 'Filière désactivée' }
  }
}