const service = require('./notifications.service')

module.exports = {
  async getAll(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    return service.getAll({
      centreId,
      userId: req.user.id,
      page:   parseInt(req.query.page)  || 1,
      limit:  parseInt(req.query.limit) || 20
    })
  },

  async markRead(req, reply) {
    return { data: await service.markRead(req.params.id, req.user.id) }
  },

  async markAllRead(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    await service.markAllRead({ centreId, userId: req.user.id })
    return { message: 'Toutes les notifications marquées comme lues' }
  }
}