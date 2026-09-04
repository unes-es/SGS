const prisma = require('../../config/db')
const { createBroadcast } = require('../notifications/notifications.service')

async function create(data) {
  const { prenom, nom, email, telephone, sujet, message } = data
  const msg = await prisma.messageContact.create({
    data: { prenom, nom, email, telephone, sujet, message }
  })

  // Best-effort in-app notification to every centre's staff — a contact
  // message isn't tied to one campus, so it broadcasts to all of them
  // rather than picking one arbitrarily. Same "never block the caller"
  // reasoning as sendEmail: a notification failure here shouldn't turn
  // into a 500 for someone who just filled out a contact form.
  try {
    const centres = await prisma.centre.findMany({ where: { isActive: true }, select: { id: true } })
    await Promise.all(centres.map(c => createBroadcast({
      centreId: c.id,
      type: 'CONTACT',
      titre: 'Nouveau message de contact',
      message: `${prenom} ${nom} — ${sujet}`,
      link: '/admin/messages'
    })))
  } catch (err) {
    console.error('contact.service.create: notification broadcast failed', err)
  }

  return msg
}

async function getAll({ isTraite, page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit
  const where = isTraite !== undefined ? { isTraite: isTraite === 'true' || isTraite === true } : {}
  const [total, nonTraites, data] = await Promise.all([
    prisma.messageContact.count({ where }),
    prisma.messageContact.count({ where: { isTraite: false } }),
    prisma.messageContact.findMany({
      where, skip, take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { traitant: { select: { prenom: true, nom: true } } }
    })
  ])
  return { data, meta: { total, nonTraites, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } }
}

async function marquerTraite(id, userId) {
  const msg = await prisma.messageContact.findUnique({ where: { id } })
  if (!msg) throw { statusCode: 404, message: 'Message non trouvé' }
  return prisma.messageContact.update({
    where: { id },
    data: { isTraite: true, traitePar: userId, traiteAt: new Date() }
  })
}

module.exports = { create, getAll, marquerTraite }
