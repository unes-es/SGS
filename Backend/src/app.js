require('dotenv').config()
const path = require('path')
const fastify = require('fastify')({
  logger: true
})

// plugins
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
})

fastify.register(require('@fastify/cookie'))

// Backs logo uploads (Sprint 6 - Paramètres) and candidature document
// uploads (Phase 2.2 Sprint 2 - CIN/diplôme scans, which run larger than a
// logo). In production this directory is only reachable directly through
// nginx's own /uploads/ alias (see docker-compose.yml on the VPS) - this
// registration exists so local dev (no nginx in front) can serve the same
// files the same way.
fastify.register(require('@fastify/multipart'), {
  limits: { fileSize: 5 * 1024 * 1024 }
})
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '..', 'uploads'),
  prefix: '/uploads/'
})

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
fastify.register(require('./modules/matieres/matieres.routes'), { prefix: '/api/matieres' })

fastify.register(require('./modules/emplois/emplois.routes'), { prefix: '/api/emplois' })

fastify.setErrorHandler((error, req, reply) => {
  const statusCode = error.statusCode || 500

  if (statusCode >= 500) {
    fastify.log.error({
      err: error,
      req: {
        method: req.method,
        url: req.url,
        body: req.body
      }
    }, 'Internal server error')
  }

  reply.status(statusCode).send({
    success: false,
    message: error.message || 'Internal Server Error'
  })
})

fastify.register(require('@fastify/rate-limit'), {
  global: false,
  max: 100,
  timeWindow: '1 minute'
})

fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  try {
    done(null, JSON.parse(body))
  } catch (err) {
    err.statusCode = 400
    done(err, undefined)
  }
})

fastify.register(require('./modules/candidatures/candidatures.routes'), { prefix: '/api/candidatures' })

fastify.register(require('./modules/notifications/notifications.routes'), { prefix: '/api/notifications' })
fastify.register(require('./modules/rapports/rapports.routes'), { prefix: '/api/rapports' })
fastify.register(require('./modules/portal/portal.routes'), { prefix: '/api/portal' })
fastify.register(require('./modules/users/users.routes'), { prefix: '/api/users' })
fastify.register(require('./modules/calendrier/calendrier.routes'), { prefix: '/api/calendrier' })

// Phase 3 — Site vitrine CMS
fastify.register(require('./modules/actualites/actualites.routes'), { prefix: '/api/actualites' })
fastify.register(require('./modules/evenements/evenements.routes'), { prefix: '/api/evenements' })
fastify.register(require('./modules/contact/contact.routes'), { prefix: '/api/contact' })

const cron = require('node-cron')
const notifService = require('./modules/notifications/notifications.service')

// Run every day at 8am — check impayés
cron.schedule('0 8 * * *', async () => {
  try {
    await notifService.checkImpayés()
    console.log('✅ Impayés check done')
  } catch (err) {
    console.error('❌ Impayés check failed:', err)
  }
})

// Run every day at 8am — check classe capacity (feature addition)
cron.schedule('0 8 * * *', async () => {
  try {
    await notifService.checkCapacite()
    console.log('✅ Capacité check done')
  } catch (err) {
    console.error('❌ Capacité check failed:', err)
  }
})

module.exports = fastify