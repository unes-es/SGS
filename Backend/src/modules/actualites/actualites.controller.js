const service = require('./actualites.service')

module.exports = {
  async getPublic(req, reply) {
    const { centreId, limit } = req.query
    return { data: await service.getPublic({ centreId, limit }) }
  },

  async getPublicById(req, reply) {
    const data = await service.getPublicById(req.params.id)
    return { data }
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
    const data = await service.create(req.body, req.user.id)
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
    return { message: 'Article supprimé' }
  },

  async updateImage(req, reply) {
    const file = await req.file()
    if (!file) {
      return reply.status(400).send({ message: 'Aucun fichier reçu' })
    }
    const buffer = await file.toBuffer()
    const data = await service.updateImage(req.params.id, { buffer, mimetype: file.mimetype })
    return { data }
  }
}
