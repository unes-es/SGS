const service = require('./salaires.service')

module.exports = {
  async getAll(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    const { personnelId, mois, annee, statut } = req.query
    return { data: await service.getAll({ centreId, personnelId, mois, annee, statut }) }
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

  async payer(req, reply) {
    const data = await service.payer(req.params.id, req.body)
    return { data }
  },

  async getStats(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    const { mois, annee } = req.query
    if (!mois || !annee) {
      return reply.status(400).send({ message: 'mois et annee requis' })
    }
    return { data: await service.getStats({ centreId, mois, annee }) }
  }
}