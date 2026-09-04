const service = require('./centres.service')

module.exports = {
  async getAll(req, reply) {
    return { data: await service.getAll() }
  },

  async getAllAdmin(req, reply) {
    return { data: await service.getAllAdmin() }
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
  },

  async updateLogo(req, reply) {
    const file = await req.file()
    if (!file) {
      return reply.status(400).send({ message: 'Aucun fichier reçu' })
    }
    const buffer = await file.toBuffer()
    const data = await service.updateLogo(req.params.id, { buffer, mimetype: file.mimetype })
    return { data }
  }
}