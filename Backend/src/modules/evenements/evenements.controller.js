const service = require('./evenements.service')

module.exports = {
  async getPublic(req, reply) {
    const { centreId, limit } = req.query
    return { data: await service.getPublic({ centreId, limit }) }
  },

  async getAllAdmin(req, reply) {
    const { centreId, page, limit } = req.query
    return service.getAllAdmin({ centreId, page, limit })
  },

  async getByIdAdmin(req, reply) {
    const data = await service.getByIdAdmin(req.params.id)
    return { data }
  },

  async create(req, reply) {
    const data = await service.create(req.body)
    return reply.status(201).send({ data })
  },

  async update(req, reply) {
    const data = await service.update(req.params.id, req.body)
    return { data }
  },

  async togglePublish(req, reply) {
    const data = await service.togglePublish(req.params.id)
    return { data }
  },

  async remove(req, reply) {
    await service.remove(req.params.id)
    return { message: 'Événement supprimé' }
  }
}
