const service = require('./documents.service')

module.exports = {
  async getAll(req, reply) {
    const { eleveId, type, page, limit } = req.query
    return service.getAll({
      eleveId, type,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    })
  },

  async getById(req, reply) {
    return { data: await service.getById(req.params.id) }
  },

  async getByEleve(req, reply) {
    return { data: await service.getByEleve(req.params.eleveId) }
  },

  async create(req, reply) {
    const data = await service.create(req.body, req.user.id)
    return reply.status(201).send({ data })
  },

  async remove(req, reply) {
    await service.remove(req.params.id)
    return { message: 'Document supprimé' }
  },
  async generatePdf(req, reply) {
    try {
      const { pdf, filename } = await service.generatePdf(req.params.id)
      reply.header('Content-Type', 'application/pdf')
      reply.header('Content-Disposition', `attachment; filename="${filename}"`)
      return reply.send(pdf)
    } catch (err) {
      console.error('PDF generation error:', err)
      // Respects a thrown error's own statusCode (e.g. the 422 from
      // generatePdf() when a RECU_PAIEMENT/ATTESTATION_TRAVAIL has no
      // resolvable paiement/personnel) instead of always answering 500 -
      // matches the pattern the global error handler in app.js already
      // uses elsewhere.
      return reply.status(err.statusCode || 500).send({ message: err.message || 'Erreur PDF' })
    }
  },
}