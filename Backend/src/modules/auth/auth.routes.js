const controller = require('./auth.controller')
const authenticate = require('../../middlewares/authenticate')

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email:    { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 }
    }
  }
}

const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'password', 'role', 'prenom', 'nom', 'centreId'],
    properties: {
      email:     { type: 'string', format: 'email' },
      password:  { type: 'string', minLength: 6 },
      role:      { type: 'string', enum: ['SUPER_ADMIN','DIRECTEUR','COMPTABLE','SECRETAIRE','PROFESSEUR','PARENT'] },
      prenom:    { type: 'string' },
      nom:       { type: 'string' },
      centreId:  { type: 'string', format: 'uuid' },
      telephone: { type: 'string' }
    }
  }
}

async function authRoutes(fastify) {
  fastify.post('/login',    { schema: loginSchema },    controller.loginHandler)
  fastify.post('/register', { schema: registerSchema }, controller.registerHandler)
  fastify.post('/refresh',  controller.refreshHandler)
  fastify.post('/logout',   controller.logoutHandler)
  fastify.get('/me', { preHandler: authenticate }, controller.getMeHandler)
}

module.exports = authRoutes