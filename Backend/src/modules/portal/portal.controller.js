const service = require('./portal.service')

module.exports = {
  async getMyCandidature(req, reply) {
    const data = await service.getMyCandidature(req.user.id)
    return { data }
  },

  async getMyEleve(req, reply) {
    const data = await service.getMyEleve(req.user.id)
    return { data }
  }
}
