const service = require('./centres.service')

module.exports = {
  async getAll(req, reply) {
    const data = await service.getAll()
    return { data }
  },

  async getById(req, reply) {
    const data = await service.getById(req.params.id)
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

  async remove(req, reply) {
    await service.remove(req.params.id)
    return { message: 'Centre désactivé' }
  }
}