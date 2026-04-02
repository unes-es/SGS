const prisma = require('../../config/db')

// auto-generate matricule like MAT-2026-0001
async function generateMatricule() {
  const year = new Date().getFullYear()
  const last = await prisma.eleve.findFirst({
    where: { matricule: { startsWith: `MAT-${year}` } },
    orderBy: { matricule: 'desc' }
  })
  const next = last ? parseInt(last.matricule.split('-')[2]) + 1 : 1
  return `MAT-${year}-${String(next).padStart(4, '0')}`
}

async function getAll({ centreId, page = 1, limit = 20, search, statut, classeId }) {
  const skip = (page - 1) * limit

  const where = {
    centreId,
    ...(statut && { statut }),
    ...(classeId && { classeId }),
    ...(search && {
      OR: [
        { matricule: { contains: search, mode: 'insensitive' } },
        { utilisateur: { nom:    { contains: search, mode: 'insensitive' } } },
        { utilisateur: { prenom: { contains: search, mode: 'insensitive' } } },
        { utilisateur: { email:  { contains: search, mode: 'insensitive' } } }
      ]
    })
  }

  const [total, eleves] = await Promise.all([
    prisma.eleve.count({ where }),
    prisma.eleve.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        utilisateur: {
          select: { prenom: true, nom: true, email: true, telephone: true }
        },
        classe: {
          select: { nom: true, filiere: { select: { nom: true } } }
        }
      }
    })
  ])

  return {
    data: eleves,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}

async function getById(id) {
  const eleve = await prisma.eleve.findUnique({
    where: { id },
    include: {
      utilisateur: {
        select: { prenom: true, nom: true, email: true, telephone: true, photoUrl: true }
      },
      classe: {
        include: { filiere: true }
      }
    }
  })
  if (!eleve) throw { statusCode: 404, message: 'Élève non trouvé' }
  return eleve
}

async function create(data, centreId) {
  const { email, password, prenom, nom, telephone, ...eleveData } = data

  // check email not taken
  const exists = await prisma.utilisateur.findUnique({ where: { email } })
  if (exists) throw { statusCode: 409, message: 'Email déjà utilisé' }

  const bcrypt = require('bcrypt')
  const matricule = await generateMatricule()
  const passwordHash = await bcrypt.hash(password || matricule, 12)

  // create utilisateur + eleve in one transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.utilisateur.create({
      data: { email, passwordHash, role: 'PARENT', prenom, nom, telephone, centreId }
    })

    const eleve = await tx.eleve.create({
    data: {
        ...eleveData,
        matricule,
        centreId,
        utilisateurId: user.id,
        dateInscription: new Date(),
        dateNaissance: new Date(eleveData.dateNaissance)  // add this
    },
    include: {
        utilisateur: { select: { prenom: true, nom: true, email: true } }
    }
    })

    return eleve
  })

  return result
}

async function update(id, data) {
  await getById(id)
  const { prenom, nom, telephone, email, ...eleveData } = data

  return prisma.$transaction(async (tx) => {
    const eleve = await tx.eleve.findUnique({ where: { id } })

    if (prenom || nom || telephone || email) {
      await tx.utilisateur.update({
        where: { id: eleve.utilisateurId },
        data: { prenom, nom, telephone, email }
      })
    }

    return tx.eleve.update({
    where: { id },
    data: {
        ...eleveData,
        ...(eleveData.dateNaissance && { 
        dateNaissance: new Date(eleveData.dateNaissance) 
        })
    },
    include: {
        utilisateur: { select: { prenom: true, nom: true, email: true } }
    }
    })
  })
}

async function updateStatut(id, statut) {
  await getById(id)
  return prisma.eleve.update({ where: { id }, data: { statut } })
}

module.exports = { getAll, getById, create, update, updateStatut }