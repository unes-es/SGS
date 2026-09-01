const service = require('./users.service')

module.exports = {
  async getAll(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    const { role, isActive, search, page, limit } = req.query
    return service.getAll({
      centreId, role, isActive, search,
      page:  parseInt(page)  || 1,
      limit: parseInt(limit) || 20
    })
  },

  async getStats(req, reply) {
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId
    return { data: await service.getStats(centreId) }
  },

  async updateRole(req, reply) {
    const data = await service.updateRole(req.params.id, req.body.role, req.user.id)
    return { data }
  },

  async setActive(req, reply) {
    const data = await service.setActive(req.params.id, req.body.isActive, req.user.id)
    return { data }
  }
}
