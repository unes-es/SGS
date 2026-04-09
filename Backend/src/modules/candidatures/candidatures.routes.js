const ctrl = require('./candidatures.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize    = require('../../middlewares/authorize')

async function candidaturesRoutes(fastify) {
  // public route — registered in isolated scope without auth hook
  fastify.register(async function publicRoutes(f) {
    f.post('/public', ctrl.create)
  })

  // protected routes — scoped with auth hook
  fastify.register(async function protectedRoutes(f) {
    f.addHook('preHandler', authenticate)
    f.get('/stats',      ctrl.getStats)
    f.get('/',           ctrl.getAll)
    f.get('/:id',        ctrl.getById)
    f.patch('/:id/statut', {
      preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE')
    }, ctrl.updateStatut)
  })
}

module.exports = candidaturesRoutes