const controller = require('./auth.controller')
const authenticate = require('../../middlewares/authenticate')
const authorize = require('../../middlewares/authorize')

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
      // CANDIDAT/ETUDIANT deliberately excluded - those accounts are only
      // ever created via the candidature flow (candidatures.service.js),
      // never through this admin-facing registration endpoint.
      role:      { type: 'string', enum: ['SUPER_ADMIN','DIRECTEUR','COMPTABLE','SECRETAIRE','PROFESSEUR','PARENT'] },
      prenom:    { type: 'string' },
      nom:       { type: 'string' },
      centreId:  { type: 'string', format: 'uuid' },
      telephone: { type: 'string' }
    }
  }
}

const forgotPasswordSchema = {
  body: {
    type: 'object',
    required: ['email'],
    properties: { email: { type: 'string', format: 'email' } }
  }
}

const resetPasswordSchema = {
  body: {
    type: 'object',
    required: ['token', 'password'],
    properties: {
      token:    { type: 'string', minLength: 1 },
      password: { type: 'string', minLength: 6 }
    }
  }
}

const updateMeSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    properties: {
      prenom:    { type: 'string', minLength: 1, maxLength: 100 },
      nom:       { type: 'string', minLength: 1, maxLength: 100 },
      telephone: { type: 'string', maxLength: 30 },
      email:     { type: 'string', format: 'email', maxLength: 255 }
    }
  }
}

const changePasswordSchema = {
  body: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: { type: 'string', minLength: 1 },
      newPassword:     { type: 'string', minLength: 6 }
    }
  }
}

async function authRoutes(fastify) {
  fastify.post('/login', {
    schema: loginSchema,
    config: {
      rateLimit: { max: 10, timeWindow: '15 minutes' }
    }
  }, controller.loginHandler)

  // Was completely public with no auth check at all - anyone could POST
  // here and self-register as SUPER_ADMIN by just setting role in the
  // body. Found while investigating Phase 2.2 (which needs a safe
  // account-creation path for CANDIDAT accounts - this wasn't it).
  // Confirmed via the frontend that nothing actually calls this route in
  // practice - Personnel creation creates its own Utilisateur internally
  // (personnel.service.js) - so restricting it breaks no existing flow.
  fastify.post('/register', {
    schema: registerSchema,
    preHandler: [authenticate, authorize('SUPER_ADMIN')]
  }, controller.registerHandler)

  fastify.post('/refresh', {
    config: {
      rateLimit: { max: 30, timeWindow: '15 minutes' }
    }
  }, controller.refreshHandler)

  fastify.post('/logout', controller.logoutHandler)
  fastify.get('/me', { preHandler: authenticate }, controller.getMeHandler)

  // Self-service - every logged-in role (staff and CANDIDAT/ETUDIANT alike)
  // can edit their own basic info and change their own password, no
  // authorize() role gate beyond "logged in as someone". Rate-limited like
  // login/forgot-password - a stolen access token brute-forcing
  // currentPassword guesses shouldn't get unlimited attempts either.
  fastify.patch('/me', { schema: updateMeSchema, preHandler: authenticate }, controller.updateMeHandler)
  fastify.post('/me/password', {
    schema: changePasswordSchema,
    preHandler: authenticate,
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } }
  }, controller.changePasswordHandler)

  // Public, rate-limited - external users (candidats/étudiants, Phase 2.2)
  // are the ones who actually need self-service password reset; staff
  // accounts are provisioned by an admin and could go through the same
  // flow too, but this is unauthenticated by nature (you're proving you
  // own the email precisely because you're NOT logged in).
  fastify.post('/forgot-password', {
    schema: forgotPasswordSchema,
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } }
  }, controller.forgotPasswordHandler)

  fastify.post('/reset-password', {
    schema: resetPasswordSchema,
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } }
  }, controller.resetPasswordHandler)
}

module.exports = authRoutes
