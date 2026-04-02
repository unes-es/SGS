const prisma = require('../../config/db')
const bcrypt = require('bcrypt')

async function getAll({ centreId, typeContrat, isActive = true }) {
  return prisma.personnel.findMany({
    where: {
      centreId,
      isActive,
      ...(typeContrat && { typeContrat })
    },
    include: {
      utilisateur: {
        select: { prenom: true, nom: true, email: true, telephone: true, photoUrl: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
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