function authorize(...roles) {
  return async function(req, reply) {
    if (!roles.includes(req.user.role)) {
      return reply.status(403).send({ message: 'Forbidden' })
    }
  }
}

module.exports = authorize