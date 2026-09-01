const ctrl = require('./documents.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')

async function documentsRoutes(fastify) {
  // Public - a QR code on a printed document is scanned by whoever has the
  // paper, not a logged-in admin, so this must NOT inherit the
  // authenticate hook below. The two route groups need to be siblings,
  // each in their OWN fastify.register() scope: a Fastify preHandler hook
  // added directly on a shared parent instance (which is what putting the
  // hook straight on the `fastify` passed into this function would do)
  // applies to every route in that parent's whole encapsulation context,
  // including children already registered on it, regardless of source
  // order. Only a hook added inside its own sibling scope stays isolated
  // from the other sibling - see candidatures.routes.js for the same
  // pattern (this file previously got this exact detail wrong: the hook
  // was on the shared parent, so /verify/:numeroSerie required a token
  // anyway despite being registered "before" the hook).
  fastify.register(async function publicRoutes(f) {
    f.get('/verify/:numeroSerie', ctrl.verify)
  })

  fastify.register(async function protectedRoutes(f) {
    f.addHook('preHandler', authenticate)

    f.get('/', ctrl.getAll)

    f.get('/:id/pdf', ctrl.generatePdf)

    f.get('/:id', ctrl.getById)
    f.get('/eleve/:eleveId', ctrl.getByEleve)

    f.post('/', {
      preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE')
    }, ctrl.create)

    f.delete('/:id', {
      preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
    }, ctrl.remove)
  })
}

module.exports = documentsRoutes