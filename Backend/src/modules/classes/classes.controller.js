const service = require('./classes.service')

module.exports = {
  async getAll(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    return { data: await service.getAll({ centreId, filiereId: req.query.filiereId, typeFormation: req.query.typeFormation }) }
  },
  async getById(req, reply) {
    return { data: await service.getById(req.params.id, req.user) }
  },
  async create(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.body.centreId || req.user.centreId
      : req.user.centreId
    const data = await service.create(req.body, centreId)
    return reply.status(201).send({ data })
  },
  async update(req, reply) {
    return { data: await service.update(req.params.id, req.body, req.user) }
  },
  async remove(req, reply) {
    await service.remove(req.params.id, req.user)
    return { message: 'Classe supprimée' }
  }
}