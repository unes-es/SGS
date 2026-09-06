const service = require('./portal.service')

module.exports = {
  async getMyCandidature(req, reply) {
    const data = await service.getMyCandidature(req.user.id)
    return { data }
  },

  async getMyEleve(req, reply) {
    const data = await service.getMyEleve(req.user.id)
    return { data }
  },

  async getMyDocuments(req, reply) {
    return { data: await service.getMyDocuments(req.user.id) }
  },

  async addMyDocument(req, reply) {
    const file = await req.file()
    if (!file) return reply.status(400).send({ message: 'Aucun fichier reçu' })
    const type = file.fields?.type?.value || 'AUTRE'
    const buffer = await file.toBuffer()
    const data = await service.addMyDocument(req.user.id, {
      type, buffer, mimetype: file.mimetype, originalFilename: file.filename
    })
    return reply.status(201).send({ data })
  },

  async getMyEvenements(req, reply) {
    return { data: await service.getMyEvenements(req.user.id) }
  },

  async addMyMessage(req, reply) {
    const data = await service.addMyMessage(req.user.id, req.body.message)
    return reply.status(201).send({ data })
  },

  async getMyNotes(req, reply) {
    return { data: await service.getMyNotes(req.user.id) }
  },

  async getMyAbsences(req, reply) {
    return { data: await service.getMyAbsences(req.user.id) }
  },

  async getMyEmploiDuTemps(req, reply) {
    return { data: await service.getMyEmploiDuTemps(req.user.id) }
  },

  async getMyPaiements(req, reply) {
    return { data: await service.getMyPaiements(req.user.id) }
  },

  async getMyEleveDocuments(req, reply) {
    return { data: await service.getMyEleveDocuments(req.user.id) }
  },

  async getMyEleveDocumentPdf(req, reply) {
    try {
      const { pdf, filename } = await service.getMyEleveDocumentPdf(req.user.id, req.params.id)
      reply.header('Content-Type', 'application/pdf')
      reply.header('Content-Disposition', `attachment; filename="${filename}"`)
      return reply.send(pdf)
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ message: err.message || 'Erreur PDF' })
    }
  },

  // Parent Portal (feature addition)
  async getMyChildren(req, reply) {
    return { data: await service.getMyChildren(req.user.id) }
  },

  async getChildNotes(req, reply) {
    return { data: await service.getChildNotes(req.user.id, req.params.eleveId) }
  },

  async getChildAbsences(req, reply) {
    return { data: await service.getChildAbsences(req.user.id, req.params.eleveId) }
  },

  async getChildEmploiDuTemps(req, reply) {
    return { data: await service.getChildEmploiDuTemps(req.user.id, req.params.eleveId) }
  },

  async getChildPaiements(req, reply) {
    return { data: await service.getChildPaiements(req.user.id, req.params.eleveId) }
  },

  async getChildDocuments(req, reply) {
    return { data: await service.getChildDocuments(req.user.id, req.params.eleveId) }
  },

  async getChildDocumentPdf(req, reply) {
    try {
      const { pdf, filename } = await service.getChildDocumentPdf(req.user.id, req.params.eleveId, req.params.docId)
      reply.header('Content-Type', 'application/pdf')
      reply.header('Content-Disposition', `attachment; filename="${filename}"`)
      return reply.send(pdf)
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ message: err.message || 'Erreur PDF' })
    }
  }
}
