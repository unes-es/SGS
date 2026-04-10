const ctrl = require('./notes.controller')
const authenticate  = require('../../middlewares/authenticate')
const authorize     = require('../../middlewares/authorize')

async function notesRoutes(fastify) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/',    ctrl.getAll)
  fastify.get('/bulletin/:eleveId/:periode/pdf', ctrl.getBulletinPdf)
  fastify.get('/bulletin/:eleveId/:periode', ctrl.getBulletin)
  fastify.get('/:id', ctrl.getById)

  // moyenne per eleve
  fastify.get('/eleve/:eleveId/moyenne', ctrl.getMoyenne)

  // ranking for a classe
  fastify.get('/classe/:classeId/moyenne', ctrl.getMoyenneClasse)

  fastify.post('/', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'PROFESSEUR')
  }, ctrl.create)

  fastify.put('/:id', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR', 'PROFESSEUR')
  }, ctrl.update)

  fastify.delete('/:id', {
    preHandler: authorize('SUPER_ADMIN', 'DIRECTEUR')
  }, ctrl.remove)
}

module.exports = notesRoutes