const prisma = require('../../config/db')
const bcrypt = require('bcrypt')

async function getAll({ centreId, typeContrat, isActive = true, search, page = 1, limit = 15 }) {
  const skip = (page - 1) * limit

  const where = {
    centreId,
    isActive,
    ...(typeContrat && { typeContrat }),
    ...(search && {
      OR: [
        { utilisateur: { nom:    { contains: search, mode: 'insensitive' } } },
        { utilisateur: { prenom: { contains: search, mode: 'insensitive' } } },
        { utilisateur: { email:  { contains: search, mode: 'insensitive' } } },
        { poste:        { contains: search, mode: 'insensitive' } },
        { cin:          { contains: search, mode: 'insensitive' } },
      ]
    })
  }

  const [total, membres] = await Promise.all([
    prisma.personnel.count({ where }),
    prisma.personnel.findMany({
      where, skip, take: limit,
      include: {
        utilisateur: { select: { prenom: true, nom: true, email: true, telephone: true } },
        salaires: { orderBy: [{ annee: 'desc' }, { mois: 'desc' }], take: 3 }
      },
      orderBy: { createdAt: 'desc' }
    })
  ])

  return {
    data: membres,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}
async function getById(id) {
  const personnel = await prisma.personnel.findUnique({
    where: { id },
    include: {
      utilisateur: {
        select: { prenom: true, nom: true, email: true, telephone: true }
      },
      salaires: {
        orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
        take: 6
      }
    }
  })
  if (!personnel) throw { statusCode: 404, message: 'Personnel non trouvé' }
  return personnel
}

async function create(data, centreId) {
  const { email, password, prenom, nom, telephone, ...personnelData } = data

  const exists = await prisma.utilisateur.findUnique({ where: { email } })
  if (exists) throw { statusCode: 409, message: 'Email déjà utilisé' }

  const passwordHash = await bcrypt.hash(password || 'sgs2026', 12)

  return prisma.$transaction(async (tx) => {
    const user = await tx.utilisateur.create({
      data: {
        email, passwordHash, prenom, nom, telephone,
        centreId, role: 'PROFESSEUR'
      }
    })

    return tx.personnel.create({
      data: { ...personnelData, centreId, utilisateurId: user.id,
        dateEmbauche: new Date(personnelData.dateEmbauche)
      },
      include: {
        utilisateur: { select: { prenom: true, nom: true, email: true } }
      }
    })
  })
}

async function update(id, data) {
  await getById(id)
  const { prenom, nom, telephone, email, ...personnelData } = data

  return prisma.$transaction(async (tx) => {
    const p = await tx.personnel.findUnique({ where: { id } })

    if (prenom || nom || telephone || email) {
      const utilisateurData = {}
      if (prenom)    utilisateurData.prenom    = prenom
      if (nom)       utilisateurData.nom       = nom
      if (telephone) utilisateurData.telephone = telephone
      if (email)     utilisateurData.email     = email

      await tx.utilisateur.update({
        where: { id: p.utilisateurId },
        data: utilisateurData
      })
    }

    return tx.personnel.update({
      where: { id },
      data: {
        ...personnelData,
        ...(personnelData.dateEmbauche && {
          dateEmbauche: new Date(personnelData.dateEmbauche)
        })
      },
      include: {
        utilisateur: { select: { prenom: true, nom: true, email: true } }
      }
    })
  })
}

async function deactivate(id) {
  await getById(id)
  return prisma.$transaction(async (tx) => {
    const p = await tx.personnel.findUnique({ where: { id } })
    await tx.utilisateur.update({ where: { id: p.utilisateurId }, data: { isActive: false } })
    return tx.personnel.update({ where: { id }, data: { isActive: false } })
  })
}

module.exports = { getAll, getById, create, update, deactivate }