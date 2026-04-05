const authService = require('./auth.service')

async function loginHandler(req, reply) {
  const user = await authService.login(req.body)

  const accessToken = await reply.jwtSign(
    { id: user.id, role: user.role, centreId: user.centreId },
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  )

  const refreshToken = await reply.jwtSign(
    { id: user.id },
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )

  reply.setCookie('refreshToken', refreshToken, {
    httpOnly: true,
//    secure: process.env.NODE_ENV === 'production',
    secure: false, // temp until we add SSL
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
  })

  return { accessToken, user }
}

async function registerHandler(req, reply) {
  const user = await authService.register(req.body)
  return reply.status(201).send({ user })
}

async function refreshHandler(req, reply) {
  const token = req.cookies?.refreshToken
  if (!token) return reply.status(401).send({ message: 'No refresh token' })

  try {
    const decoded = await req.jwtVerify({ onlyCookie: true })

    const accessToken = await reply.jwtSign(
      { id: decoded.id },
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    )

    return { accessToken }
  } catch {
    return reply.status(401).send({ message: 'Invalid refresh token' })
  }
}

async function logoutHandler(req, reply) {
  reply.clearCookie('refreshToken', { path: '/api/auth/refresh' })
  return { message: 'Logged out' }
}

async function getMeHandler(req, reply) {
  const user = await authService.getMe(req.user.id)
  return { user }
}

module.exports = {
  loginHandler,
  registerHandler,
  refreshHandler,
  logoutHandler,
  getMeHandler
}