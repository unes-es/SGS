const prisma = require('../../config/db')
const fs = require('fs/promises')
const path = require('path')

// Public site only ever sees published items, most recent first. centreId
// filter is optional - actualites with centreId null apply to both
// campuses and are always included alongside a centre-specific filter,
// same "global or scoped" pattern as FormationTarif.
async function getPublic({ centreId, limit = 20 } = {}) {
  const where = {
    isPublished: true,
    ...(centreId ? { OR: [{ centreId }, { centreId: null }] } : {})
  }
  return prisma.actualite.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    take: Number(limit),
    include: { centre: { select: { nom: true } } }
  })
}

async function getPublicById(id) {
  const actu = await prisma.actualite.findUnique({ where: { id } })
  if (!actu || !actu.isPublished) throw { statusCode: 404, message: 'Article non trouvé' }
  return actu
}

async function getAllAdmin({ centreId, page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit
  const where = centreId ? { OR: [{ centreId }, { centreId: null }] } : {}
  const [total, data] = await Promise.all([
    prisma.actualite.count({ where }),
    prisma.actualite.findMany({
      where, skip, take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        centre: { select: { nom: true } },
        auteur: { select: { prenom: true, nom: true } }
      }
    })
  ])
  return { data, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } }
}

async function getByIdAdmin(id) {
  const actu = await prisma.actualite.findUnique({
    where: { id },
    include: { centre: { select: { nom: true } }, auteur: { select: { prenom: true, nom: true } } }
  })
  if (!actu) throw { statusCode: 404, message: 'Article non trouvé' }
  return actu
}

async function create(data, auteurId) {
  const { categorie, titre, extrait, contenu, centreId, isPublished } = data
  return prisma.actualite.create({
    data: {
      categorie, titre, extrait, contenu,
      centreId: centreId || null,
      auteurId,
      isPublished: !!isPublished,
      publishedAt: isPublished ? new Date() : null
    }
  })
}

async function update(id, data) {
  const existing = await getByIdAdmin(id)
  const { categorie, titre, extrait, contenu, centreId, isPublished } = data

  // publishedAt is set the first time an article transitions to
  // published, and left alone on every subsequent edit - re-publishing
  // shouldn't bump an article back to the top of a date-sorted feed.
  const publishedAt = isPublished && !existing.isPublished
    ? new Date()
    : (isPublished ? existing.publishedAt : null)

  return prisma.actualite.update({
    where: { id },
    data: {
      ...(categorie !== undefined && { categorie }),
      ...(titre !== undefined && { titre }),
      ...(extrait !== undefined && { extrait }),
      ...(contenu !== undefined && { contenu }),
      ...(centreId !== undefined && { centreId: centreId || null }),
      ...(isPublished !== undefined && { isPublished, publishedAt })
    }
  })
}

async function togglePublish(id) {
  const existing = await getByIdAdmin(id)
  const isPublished = !existing.isPublished
  return prisma.actualite.update({
    where: { id },
    data: {
      isPublished,
      publishedAt: isPublished ? (existing.publishedAt || new Date()) : existing.publishedAt
    }
  })
}

async function remove(id) {
  await getByIdAdmin(id)
  return prisma.actualite.delete({ where: { id } })
}

const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'uploads', 'actualites')
// Same rationale as centres.service.js's logo upload - SVG excluded, this
// image only ever renders as a card background in the browser (never fed
// through pdfkit), but keeping the allowed-type list identical everywhere
// avoids a confusing "why does this endpoint accept SVG and that one
// doesn't" inconsistency.
const ALLOWED_IMAGE_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp'
}

async function updateImage(id, { buffer, mimetype }) {
  const actu = await getByIdAdmin(id)

  const ext = ALLOWED_IMAGE_TYPES[mimetype]
  if (!ext) {
    throw { statusCode: 400, message: 'Format non supporté (PNG, JPEG ou WEBP uniquement)' }
  }

  const filename = `${id}-${Date.now()}.${ext}`
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer)

  if (actu.imageUrl?.startsWith('/uploads/actualites/')) {
    const oldFilename = actu.imageUrl.split('/').pop()
    fs.unlink(path.join(UPLOADS_DIR, oldFilename)).catch(() => {})
  }

  return prisma.actualite.update({
    where: { id },
    data: { imageUrl: `/uploads/actualites/${filename}` }
  })
}

module.exports = {
  getPublic, getPublicById, getAllAdmin, getByIdAdmin,
  create, update, togglePublish, remove, updateImage
}
