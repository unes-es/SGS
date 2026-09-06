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
    // Was hardcoded false "temp until we add SSL" - SSL's been live on
    // sgs.nextsi.ma for a while now (see docs/DEPLOYMENT.md), this was
    // just never flipped back. secure:false meant this cookie was sent
    // over plain HTTP too, not just HTTPS.
    secure: process.env.NODE_ENV === 'production',
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

    // Was `{ id: decoded.id }` only - the refreshed access token carried
    // no role/centreId at all, unlike loginHandler's. authenticate.js
    // happens to re-fetch the full user from the DB on every request
    // regardless (so this wasn't breaking anything live today), but any
    // future code that trusts the token payload's role/centreId directly
    // would have silently misbehaved for the rest of a refreshed
    // session. Re-reading fresh from the DB here also means a role
    // change or deactivation takes effect on the next silent refresh,
    // not just at next login.
    const user = await authService.getActiveUserForRefresh(decoded.id)

    const accessToken = await reply.jwtSign(
      { id: user.id, role: user.role, centreId: user.centreId },
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    )

    return { accessToken }
  } catch (err) {
    return reply.status(err.statusCode || 401).send({ message: err.message || 'Invalid refresh token' })
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

async function updateMeHandler(req, reply) {
  const user = await authService.updateMe(req.user.id, req.body)
  return { user }
}

async function changePasswordHandler(req, reply) {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword)
  return { message: 'Mot de passe mis à jour' }
}

async function forgotPasswordHandler(req, reply) {
  await authService.requestPasswordReset(req.body.email)
  // Always the same response regardless of whether the email exists -
  // see the "deliberately no distinction" comment in auth.service.js.
  return { message: 'Si ce compte existe, un email a été envoyé.' }
}

async function resetPasswordHandler(req, reply) {
  await authService.resetPassword(req.body.token, req.body.password)
  return { message: 'Mot de passe mis à jour' }
}

module.exports = {
  loginHandler,
  registerHandler,
  refreshHandler,
  logoutHandler,
  getMeHandler,
  updateMeHandler,
  changePasswordHandler,
  forgotPasswordHandler,
  resetPasswordHandler
}
