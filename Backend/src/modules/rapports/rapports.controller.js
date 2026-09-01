const service = require('./rapports.service')

module.exports = {
  async getRapportFinancier(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    return { data: await service.getRapportFinancier(centreId, req.query) }
  },

  async getTauxPresence(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    return { data: await service.getTauxPresence(centreId, req.query) }
  },

  async getTauxReussite(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    return { data: await service.getTauxReussite(centreId, req.query) }
  },

  async exportFEC(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    const csv = await service.exportFEC(centreId, req.query)
    const annee = req.query.annee || new Date().getFullYear()
    const mois  = req.query.mois  || 'annuel'
    reply.header('Content-Type', 'text/plain')
    reply.header('Content-Disposition', `attachment; filename="FEC-SGS-${annee}-${mois}.txt"`)
    return reply.send(csv)
  }
}