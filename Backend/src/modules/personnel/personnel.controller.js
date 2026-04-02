const service = require('./personnel.service')

module.exports = {
  async getAll(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    const { typeContrat, isActive } = req.query
    return { data: await service.getAll({
      centreId, typeContrat,
      isActive: isActive === 'false' ? false : true
    })}
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

  async deactivate(req, reply) {
    await service.deactivate(req.params.id)
    return { message: 'Personnel désactivé' }
  }
}