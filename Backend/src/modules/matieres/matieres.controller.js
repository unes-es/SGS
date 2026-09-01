const service = require('./matieres.service')

module.exports = {
  async getAll(req, reply) {
    const { filiereId } = req.query
    return { data: await service.getAll({ filiereId }) }
  },

  async create(req, reply) {
    // Kept as a bare `data` return (not `{ data }`, not 201) - matches the
    // exact response shape the previous inline route returned, since this
    // is a pure refactor and frontend code depends on that shape.
    return service.create(req.body)
  },

  async update(req, reply) {
    const data = await service.update(req.params.id, req.body)
    return { data }
  },

  async remove(req, reply) {
    await service.remove(req.params.id)
    return { message: 'Supprimée' }
  }
}
