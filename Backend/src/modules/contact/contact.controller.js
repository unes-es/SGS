const service = require('./contact.service')

module.exports = {
  async create(req, reply) {
    const data = await service.create(req.body)
    return reply.status(201).send({ data })
  },

  async getAll(req, reply) {
    const { isTraite, page, limit } = req.query
    return service.getAll({ isTraite, page, limit })
  },

  async marquerTraite(req, reply) {
    const data = await service.marquerTraite(req.params.id, req.user.id)
    return { data }
  }
}
