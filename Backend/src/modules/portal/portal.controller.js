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
  }
}
