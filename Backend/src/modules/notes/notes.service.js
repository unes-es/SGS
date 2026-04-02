const prisma = require('../../config/db')

async function getAll({ eleveId, matiereId, classeId, periode, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit

  const where = {
    ...(eleveId   && { eleveId }),
    ...(matiereId && { matiereId }),
    ...(periode   && { periode }),
    ...(classeId  && { eleve: { classeId } })
  }

  const [total, notes] = await Promise.all([
    prisma.note.count({ where }),
    prisma.note.findMany({
      where, skip, take: limit,
      orderBy: { dateEval: 'desc' },
      include: {
        eleve: {
          include: {
            utilisateur: { select: { prenom: true, nom: true } }
          }
        },
        matiere:      { select: { nom: true, coefficient: true } },
        saisieParUser:{ select: { prenom: true, nom: true } }
      }
    })
  ])

  return {
    data: notes,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}

async function getById(id) {
  const note = await prisma.note.findUnique({
    where: { id },
    include: {
      eleve:   { include: { utilisateur: { select: { prenom: true, nom: true } } } },
      matiere: { select: { nom: true, coefficient: true } }
    }
  })
  if (!note) throw { statusCode: 404, message: 'Note non trouvée' }
  return note
}

async function create(data, saisiePar) {
  return prisma.note.create({
    data: {
      ...data,
      saisiePar,
      note:     parseFloat(data.note),
      noteMax:  parseFloat(data.noteMax  || 20),
      dateEval: new Date(data.dateEval)
    },
    include: {
      eleve:   { include: { utilisateur: { select: { prenom: true, nom: true } } } },
      matiere: { select: { nom: true } }
    }
  })
}

async function update(id, data) {
  await getById(id)
  return prisma.note.update({
    where: { id },
    data: {
      ...data,
      ...(data.note     && { note:     parseFloat(data.note) }),
      ...(data.noteMax  && { noteMax:  parseFloat(data.noteMax) }),
      ...(data.dateEval && { dateEval: new Date(data.dateEval) })
    },
    include: {
      eleve:   { include: { utilisateur: { select: { prenom: true, nom: true } } } },
      matiere: { select: { nom: true } }
    }
  })
}

async function remove(id) {
  await getById(id)
  return prisma.note.delete({ where: { id } })
}

// average per eleve per periode
async function getMoyenne(eleveId, periode) {
  const notes = await prisma.note.findMany({
    where: { eleveId, periode },
    include: { matiere: { select: { coefficient: true, nom: true } } }
  })

  if (notes.length === 0) return { moyenne: null, notes: [] }

  let totalCoeff  = 0
  let totalPoints = 0

  const detail = notes.map(n => {
    const coeff = parseFloat(n.matiere.coefficient)
    const note  = parseFloat(n.note)
    totalCoeff  += coeff
    totalPoints += note * coeff
    return {
      matiere:     n.matiere.nom,
      note,
      noteMax:     parseFloat(n.noteMax),
      coefficient: coeff,
      typeEval:    n.typeEval
    }
  })

  const moyenne = totalCoeff > 0
    ? Math.round((totalPoints / totalCoeff) * 100) / 100
    : null

  return { moyenne, periode, detail }
}

// all moyennes for a classe in a periode
async function getMoyenneClasse(classeId, periode) {
  const eleves = await prisma.eleve.findMany({
    where: { classeId },
    include: { utilisateur: { select: { prenom: true, nom: true } } }
  })

  const results = await Promise.all(
    eleves.map(async eleve => {
      const { moyenne } = await getMoyenne(eleve.id, periode)
      return {
        eleveId:  eleve.id,
        prenom:   eleve.utilisateur.prenom,
        nom:      eleve.utilisateur.nom,
        matricule:eleve.matricule,
        moyenne
      }
    })
  )

  // sort by moyenne desc, assign rang
  const sorted = results
    .filter(r => r.moyenne !== null)
    .sort((a, b) => b.moyenne - a.moyenne)
    .map((r, i) => ({ ...r, rang: i + 1 }))

  return sorted
}

module.exports = { getAll, getById, create, update, remove, getMoyenne, getMoyenneClasse }