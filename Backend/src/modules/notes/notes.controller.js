const service = require('./notes.service')

module.exports = {
  async getAll(req, reply) {
    const { eleveId, matiereId, classeId, periode, page, limit } = req.query
    return service.getAll({
      eleveId, matiereId, classeId, periode,
      page:  parseInt(page)  || 1,
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

  async update(req, reply) {
    return { data: await service.update(req.params.id, req.body) }
  },

  async remove(req, reply) {
    await service.remove(req.params.id)
    return { message: 'Note supprimée' }
  },

  async getMoyenne(req, reply) {
    const { periode } = req.query
    if (!periode) return reply.status(400).send({ message: 'periode requis' })
    return { data: await service.getMoyenne(req.params.eleveId, periode) }
  },

  async getMoyenneClasse(req, reply) {
    const { periode } = req.query
    if (!periode) return reply.status(400).send({ message: 'periode requis' })
    return { data: await service.getMoyenneClasse(req.params.classeId, periode) }
  }
}