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

async function getBulletin(eleveId, periode) {
  // get eleve info
  const eleve = await prisma.eleve.findUnique({
    where: { id: eleveId },
    include: {
      utilisateur: { select: { prenom: true, nom: true, email: true } },
      classe: {
        include: { filiere: true }
      }
    }
  })
  if (!eleve) throw { statusCode: 404, message: 'Élève non trouvé' }

  // get centre info
  const centre = await prisma.centre.findFirst()

  // get notes for this eleve/periode
  const notes = await prisma.note.findMany({
    where: { eleveId, periode },
    include: { matiere: { select: { nom: true, coefficient: true } } },
    orderBy: { matiere: { nom: 'asc' } }
  })

  // compute moyenne per matiere (group by matiere)
  const byMatiere = {}
  for (const n of notes) {
    const key = n.matiereId
    if (!byMatiere[key]) {
      byMatiere[key] = {
        nom:         n.matiere.nom,
        coefficient: parseFloat(n.matiere.coefficient),
        notes:       []
      }
    }
    byMatiere[key].notes.push({
      note:     parseFloat(n.note),
      noteMax:  parseFloat(n.noteMax),
      typeEval: n.typeEval
    })
  }

  // average per matiere
  const matieres = Object.values(byMatiere).map(m => {
    const totalNote = m.notes.reduce((s, n) => s + (n.note / n.noteMax) * 20, 0)
    const moyenne   = Math.round((totalNote / m.notes.length) * 100) / 100
    return { ...m, moyenne }
  })

  // overall weighted average
  const totalCoeff  = matieres.reduce((s, m) => s + m.coefficient, 0)
  const totalPoints = matieres.reduce((s, m) => s + m.moyenne * m.coefficient, 0)
  const moyenne     = totalCoeff > 0
    ? Math.round((totalPoints / totalCoeff) * 100) / 100
    : null

  // mention
  const getMention = (m) => {
    if (m >= 16) return 'Très bien'
    if (m >= 14) return 'Bien'
    if (m >= 12) return 'Assez bien'
    if (m >= 10) return 'Passable'
    return 'Insuffisant'
  }

  // rank in class
  const classement = await getMoyenneClasse(eleve.classeId, periode)
  const rang       = classement.find(r => r.eleveId === eleveId)?.rang || null
  const totalEleves = classement.length

  return {
    eleve,
    centre,
    periode,
    matieres,
    moyenne,
    mention:     moyenne ? getMention(moyenne) : null,
    rang,
    totalEleves,
    anneeScolaire: eleve.classe?.anneeScolaire || '2025-2026'
  }
}

module.exports = { getAll, getById, create, update, remove, getMoyenne, getMoyenneClasse, getBulletin }