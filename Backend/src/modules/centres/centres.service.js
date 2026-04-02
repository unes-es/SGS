const prisma = require('../../config/db')

async function getAll() {
  return prisma.centre.findMany({
    where: { isActive: true },
    orderBy: { nom: 'asc' }
  })
}

async function getById(id) {
  const centre = await prisma.centre.findUnique({ where: { id } })
  if (!centre) throw { statusCode: 404, message: 'Centre non trouvé' }
  return centre
}

async function create(data) {
  const exists = await prisma.centre.findUnique({ where: { slug: data.slug } })
  if (exists) throw { statusCode: 409, message: 'Slug déjà utilisé' }
  return prisma.centre.create({ data })
}

async function update(id, data) {
  await getById(id)
  return prisma.centre.update({ where: { id }, data })
}

async function remove(id) {
  await getById(id)
  return prisma.centre.update({ where: { id }, data: { isActive: false } })
}

module.exports = { getAll, getById, create, update, remove }