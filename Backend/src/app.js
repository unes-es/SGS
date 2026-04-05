require('dotenv').config()
const prisma = require('./config/db')
const fastify = require('fastify')({
  logger: true
})

// plugins
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
})

fastify.register(require('@fastify/cookie'))

fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET,
  cookie: {
    cookieName: 'refreshToken',
    signed: false
  }
})

// health check
fastify.get('/health', async () => {
  return { status: 'ok', app: 'SGS API', version: '1.0.0' }
})

fastify.register(require('./modules/auth/auth.routes'), { prefix: '/api/auth' })
fastify.register(require('./modules/centres/centres.routes'), { prefix: '/api/centres' })
fastify.register(require('./modules/eleves/eleves.routes'), { prefix: '/api/eleves' })
fastify.register(require('./modules/filieres/filieres.routes'), { prefix: '/api/filieres' })
fastify.register(require('./modules/classes/classes.routes'), { prefix: '/api/classes' })
fastify.register(require('./modules/absences/absences.routes'), { prefix: '/api/absences' })
fastify.register(require('./modules/notes/notes.routes'), { prefix: '/api/notes' })
fastify.register(require('./modules/personnel/personnel.routes'), { prefix: '/api/personnel' })
fastify.register(require('./modules/salaires/salaires.routes'), { prefix: '/api/salaires' })
fastify.register(require('./modules/caisse/caisse.routes'), { prefix: '/api/caisse' })
fastify.register(require('./modules/documents/documents.routes'), { prefix: '/api/documents' })
fastify.register(async function (f) {
  f.addHook('preHandler', require('./middlewares/authenticate'))
  f.get('/matieres', async (req, reply) => {
    const { filiereId } = req.query
    const matieres = await prisma.matiere.findMany({
      where: { ...(filiereId && { filiereId }) },
      orderBy: { nom: 'asc' }
    })
    return { data: matieres }
  })
}, { prefix: '/api' })

fastify.register(require('./modules/emplois/emplois.routes'), { prefix: '/api/emplois' })


fastify.register(async function (f) {
  f.addHook('preHandler', require('./middlewares/authenticate'))

  f.post('/matieres', async (req) => {
    // On récupère les données du corps de la requête
    const { nom, code, coefficient, volumeHoraire, estOptionnelle, filiereId } = req.body;

    const data = await prisma.matiere.create({
      data: {
        nom: nom,
        code: code || "",
        coefficient: parseInt(coefficient) || 1, // Sécurité pour le coefficient
        volumeHoraire: volumeHoraire ? parseInt(volumeHoraire) : null, // Conversion ICI
        estOptionnelle: Boolean(estOptionnelle),
        filiereId: filiereId
      }
    });
    return data;
  })

  f.put('/matieres/:id', async (req) => {
    const data = await prisma.matiere.update({
      where: { id: req.params.id },
      data: req.body
    })
    return { data }
  })

  f.delete('/matieres/:id', async (req) => {
    await prisma.matiere.delete({ where: { id: req.params.id } })
    return { message: 'Supprimée' }
  })
}, { prefix: '/api' })

fastify.setErrorHandler((error, req, reply) => {
  const statusCode = error.statusCode || 500
  reply.status(statusCode).send({
    success: false,
    message: error.message || 'Internal Server Error'
  })
})

module.exports = fastify