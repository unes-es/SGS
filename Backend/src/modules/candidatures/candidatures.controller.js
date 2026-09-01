const service = require('./candidatures.service')

module.exports = {
  async getAll(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    const { statut, page, limit } = req.query
    return service.getAll({
      centreId, statut,
      page:  parseInt(page)  || 1,
      limit: parseInt(limit) || 20
    })
  },

  async getById(req, reply) {
    return { data: await service.getById(req.params.id) }
  },

  async create(req, reply) {
    const data = await service.create(req.body)
    return reply.status(201).send({ data })
  },

  async updateStatut(req, reply) {
    const data = await service.updateStatut(req.params.id, req.body, req.user.id)
    return { data }
  },

  async getStats(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    return { data: await service.getStats(centreId) }
  },

  async getDocuments(req, reply) {
    return { data: await service.getDocuments(req.params.id) }
  },

  async addDocument(req, reply) {
    const file = await req.file()
    if (!file) return reply.status(400).send({ message: 'Aucun fichier reçu' })
    const type = file.fields?.type?.value || 'AUTRE'
    const buffer = await file.toBuffer()
    const data = await service.addDocument(req.params.id, {
      type, buffer, mimetype: file.mimetype, originalFilename: file.filename
    })
    return reply.status(201).send({ data })
  },

  async getEvenements(req, reply) {
    return { data: await service.getEvenements(req.params.id) }
  },

  async addMessage(req, reply) {
    const data = await service.addMessage(req.params.id, {
      message: req.body.message,
      auteurId: req.user.id,
      auteurRole: 'STAFF'
    })
    return reply.status(201).send({ data })
  },

  async updateStatutBulk(req, reply) {
    const data = await service.updateStatutBulk(req.body.ids, { statut: req.body.statut }, req.user.id)
    return { data }
  },

  async exportCsv(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    const csv = await service.exportCsv({ centreId, statut: req.query.statut })
    reply.header('Content-Type', 'text/csv; charset=utf-8')
    reply.header('Content-Disposition', `attachment; filename="candidatures-${new Date().toISOString().slice(0, 10)}.csv"`)
    return reply.send(csv)
  }
}