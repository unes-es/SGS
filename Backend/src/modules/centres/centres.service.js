const prisma = require('../../config/db')

async function getAll() {
  return prisma.centre.findMany({
    where: { isActive: true },
    orderBy: { nom: 'asc' }
  })
}

// Staff-only counterpart to getAll() - includes inactive centres (so a
// SUPER_ADMIN can find and reactivate one) and per-centre headcounts, for
// the Centres management admin page. getAll() itself stays public and
// active-only on purpose (the landing page reads it directly, unauthed).
//
// Eleve has a centreId column but no declared Prisma relation back to
// Centre (only Classe does), so it can't go through _count/include like
// utilisateurs/personnel below - grouped separately and merged in.
async function getAllAdmin() {
  const [centres, eleveCounts] = await Promise.all([
    prisma.centre.findMany({
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { utilisateurs: true, personnel: true } }
      }
    }),
    prisma.eleve.groupBy({ by: ['centreId'], _count: true })
  ])

  const elevesByCentre = Object.fromEntries(eleveCounts.map(e => [e.centreId, e._count]))
  return centres.map(c => ({
    ...c,
    _count: { ...c._count, eleves: elevesByCentre[c.id] || 0 }
  }))
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

const fs = require('fs/promises')
const path = require('path')

const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'uploads', 'logos')
// SVG deliberately excluded - pdfkit (utils/pdf.js, which is what actually
// puts this logo on documents) can't embed vector images without a much
// heavier dependency, so an SVG upload would silently never show up on any
// generated PDF while still looking "successful" in the Paramètres page.
const ALLOWED_LOGO_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp'
}

async function updateLogo(id, { buffer, mimetype }) {
  const centre = await getById(id)

  const ext = ALLOWED_LOGO_TYPES[mimetype]
  if (!ext) {
    throw { statusCode: 400, message: 'Format non supporté (PNG, JPEG, WEBP ou SVG uniquement)' }
  }

  const filename = `${id}-${Date.now()}.${ext}`
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer)

  // Best-effort cleanup of the previous logo - a failure here (file
  // already gone, permissions, whatever) shouldn't block the new upload
  // from succeeding.
  if (centre.logoUrl?.startsWith('/uploads/logos/')) {
    const oldFilename = centre.logoUrl.split('/').pop()
    fs.unlink(path.join(UPLOADS_DIR, oldFilename)).catch(() => {})
  }

  return prisma.centre.update({
    where: { id },
    data: { logoUrl: `/uploads/logos/${filename}` }
  })
}

module.exports = { getAll, getAllAdmin, getById, create, update, remove, updateLogo }