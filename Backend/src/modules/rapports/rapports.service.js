const prisma = require('../../config/db')

// ── RAPPORT FINANCIER ─────────────────────────────

async function getRapportFinancier(centreId, { annee, mois }) {
  const months = []

  const startMois = mois ? parseInt(mois) : 1
  const endMois   = mois ? parseInt(mois) : 12
  const anneeInt  = parseInt(annee) || new Date().getFullYear()

  for (let m = startMois; m <= endMois; m++) {
    const start = new Date(anneeInt, m - 1, 1)
    const end   = new Date(anneeInt, m, 0)

    const [entrees, sorties, nbPaiements] = await Promise.all([
      prisma.paiementEleve.aggregate({
        where: { caisse: { centreId }, datePaiement: { gte: start, lte: end } },
        _sum: { montant: true },
        _count: true
      }),
      prisma.bonCaisse.aggregate({
        where: { caisse: { centreId }, type: 'SORTIE', dateOperation: { gte: start, lte: end } },
        _sum: { montant: true }
      }),
      prisma.paiementEleve.count({
        where: { caisse: { centreId }, datePaiement: { gte: start, lte: end } }
      })
    ])

    const totalEntrees = parseFloat(entrees._sum.montant || 0)
    const totalSorties = parseFloat(sorties._sum.montant || 0)

    months.push({
      mois:        m,
      annee:       anneeInt,
      label:       new Date(anneeInt, m - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      entrees:     totalEntrees,
      sorties:     totalSorties,
      solde:       totalEntrees - totalSorties,
      nbPaiements
    })
  }

  const totals = months.reduce((acc, m) => ({
    entrees: acc.entrees + m.entrees,
    sorties: acc.sorties + m.sorties,
    solde:   acc.solde   + m.solde,
  }), { entrees: 0, sorties: 0, solde: 0 })

  const periodeStart = new Date(anneeInt, startMois - 1, 1)
  const periodeEnd   = new Date(anneeInt, endMois, 0)

  // Line-item paiements for the period, for the detail table on the
  // Financier tab - the frontend already had this table built, capped at
  // 200 rows since a full year can have hundreds of paiements and this
  // report isn't paginated.
  const paiements = await prisma.paiementEleve.findMany({
    where: { caisse: { centreId }, datePaiement: { gte: periodeStart, lte: periodeEnd } },
    orderBy: { datePaiement: 'desc' },
    take: 200,
    include: { eleve: { include: { utilisateur: { select: { prenom: true, nom: true } } } } }
  })

  return {
    // Both the raw `months` array and the frontend's expected field names
    // are returned - `parMois`/`totalEntrees`/`totalSorties`/`solde` are
    // what FinancierTab in Rapports.jsx actually destructures; `months`/
    // `totals` are kept too in case anything else already reads them.
    months,
    totals,
    parMois: months,
    totalEntrees: totals.entrees,
    totalSorties: totals.sorties,
    solde: totals.solde,
    paiements,
    annee: anneeInt
  }
}

// ── TAUX DE PRÉSENCE ──────────────────────────────

async function getTauxPresence(centreId, { classeId, annee }) {
  const anneeInt = parseInt(annee) || new Date().getFullYear()
  const start    = new Date(anneeInt, 0, 1)
  const end      = new Date(anneeInt, 11, 31)

  // Classe has no isActive/soft-delete field (unlike Filiere, which does) -
  // this used to filter on one that doesn't exist in the schema, which
  // made this endpoint 500 on every call without an explicit classeId.
  const whereClasse = classeId
    ? { centreId, id: classeId }
    : { centreId }

  const classes = await prisma.classe.findMany({
    where: whereClasse,
    include: {
      eleves: {
        where: { statut: 'ACTIF' },
        include: {
          utilisateur: { select: { prenom: true, nom: true } },
          absences: {
            where: { dateAbsence: { gte: start, lte: end } }
          }
        }
      }
    }
  })

  // parEleve: one row per élève, flattened across every class in scope -
  // this is what PresenceTab's "Top absences par élève" table reads.
  const parEleve = []

  // parClasse: one row per classe, aggregating its élèves' absences - what
  // PresenceTab's "par classe" table reads. Both are built from the same
  // query in one pass rather than two separate round trips.
  const parClasse = classes.map(classe => {
    let totalAbsences = 0
    let justifiees = 0

    classe.eleves.forEach(eleve => {
      const eleveAbsences = eleve.absences.length
      const eleveJustifiees = eleve.absences.filter(a => a.estJustifiee).length
      totalAbsences += eleveAbsences
      justifiees += eleveJustifiees

      parEleve.push({
        eleveId: eleve.id,
        nom: eleve.utilisateur.nom,
        prenom: eleve.utilisateur.prenom,
        classe: classe.nom,
        totalAbsences: eleveAbsences,
        justifiees: eleveJustifiees
      })
    })

    // assume ~200 school days per year
    const tauxPresence = classe.eleves.length > 0
      ? Math.max(0, Math.round(((200 * classe.eleves.length - totalAbsences) / (200 * classe.eleves.length)) * 100))
      : 100

    return {
      classeId: classe.id,
      nom: classe.nom,
      totalAbsences,
      justifiees,
      tauxPresence
    }
  })

  parEleve.sort((a, b) => b.totalAbsences - a.totalAbsences)

  return { parClasse, parEleve }
}

// ── TAUX DE RÉUSSITE ──────────────────────────────

async function getTauxReussite(centreId, { periode, annee }) {
  const filieres = await prisma.filiere.findMany({
    where: { centreId, isActive: true },
    include: {
      classes: {
        include: {
          eleves: {
            where: { statut: 'ACTIF' },
            include: {
              notes: {
                where: {
                  ...(periode && { periode }),
                }
              }
            }
          }
        }
      }
    }
  })

  // Weighted moyenne + réussite (>=10) for one élève, shared by both the
  // per-filiere aggregate below and the per-classe breakdown.
  function eleveResult(eleve) {
    if (eleve.notes.length === 0) return null

    const notesByMatiere = {}
    eleve.notes.forEach(n => {
      if (!notesByMatiere[n.matiereId]) notesByMatiere[n.matiereId] = []
      notesByMatiere[n.matiereId].push(parseFloat(n.note))
    })

    let totalPoints = 0
    let totalCoeff  = 0
    Object.values(notesByMatiere).forEach(notes => {
      const avg = notes.reduce((s, n) => s + n, 0) / notes.length
      totalPoints += avg
      totalCoeff  += 1
    })

    return totalCoeff > 0 ? totalPoints / totalCoeff : 0
  }

  const parClasse = []

  const parFiliere = filieres.map(filiere => {
    let totalEleves  = 0
    let totalReussi  = 0
    let sommeMoyennes = 0
    let nbAvecNotes  = 0

    filiere.classes.forEach(classe => {
      let classeTotalEleves = 0
      let classeReussi = 0
      let classeSommeMoyennes = 0
      let classeNbAvecNotes = 0

      classe.eleves.forEach(eleve => {
        totalEleves++
        classeTotalEleves++
        const moyenne = eleveResult(eleve)
        if (moyenne === null) return

        sommeMoyennes += moyenne
        nbAvecNotes++
        classeSommeMoyennes += moyenne
        classeNbAvecNotes++
        if (moyenne >= 10) {
          totalReussi++
          classeReussi++
        }
      })

      parClasse.push({
        classeId: classe.id,
        nom: classe.nom,
        filiere: filiere.nom,
        totalEleves: classeTotalEleves,
        moyenneClasse: classeNbAvecNotes > 0 ? Math.round((classeSommeMoyennes / classeNbAvecNotes) * 100) / 100 : null,
        tauxReussite: classeTotalEleves > 0 ? Math.round((classeReussi / classeTotalEleves) * 100) : 0
      })
    })

    return {
      filiereId:    filiere.id,
      filiere:      filiere.nom,
      totalEleves,
      totalReussi,
      tauxReussite: totalEleves > 0 ? Math.round((totalReussi / totalEleves) * 100) : 0,
      moyenneGenerale: nbAvecNotes > 0 ? Math.round((sommeMoyennes / nbAvecNotes) * 100) / 100 : null
    }
  })

  return { parFiliere, parClasse }
}

// ── EXPORT FEC/SAGE ───────────────────────────────

async function exportFEC(centreId, { annee, mois }) {
  const anneeInt = parseInt(annee) || new Date().getFullYear()
  const start    = mois
    ? new Date(anneeInt, parseInt(mois) - 1, 1)
    : new Date(anneeInt, 0, 1)
  const end      = mois
    ? new Date(anneeInt, parseInt(mois), 0)
    : new Date(anneeInt, 11, 31)

  const [paiements, bons] = await Promise.all([
    prisma.paiementEleve.findMany({
      where: { caisse: { centreId }, datePaiement: { gte: start, lte: end } },
      include: {
        eleve:  { include: { utilisateur: { select: { prenom: true, nom: true } } } },
        caisse: { select: { nom: true } }
      },
      orderBy: { datePaiement: 'asc' }
    }),
    prisma.bonCaisse.findMany({
      where: { caisse: { centreId }, dateOperation: { gte: start, lte: end } },
      include: { caisse: { select: { nom: true } } },
      orderBy: { dateOperation: 'asc' }
    })
  ])

  const formatDate = (d) => {
    const date = new Date(d)
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  }

  const lines = []

  // FEC header
  lines.push([
    'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
    'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
    'PieceRef', 'PieceDate', 'EcritureLib',
    'Debit', 'Credit', 'EcritureLet', 'DateLet', 'ValidDate',
    'Montantdevise', 'Idevise'
  ].join('|'))

  let ecritureNum = 1

  // Paiements élèves → débit caisse (512), crédit produit (706)
  paiements.forEach(p => {
    const date    = formatDate(p.datePaiement)
    const ref     = p.reference
    const lib     = `Scolarite ${p.eleve.utilisateur.prenom} ${p.eleve.utilisateur.nom}`
    const montant = parseFloat(p.montant).toFixed(2)
    const num     = String(ecritureNum).padStart(6, '0')

    // Débit caisse
    lines.push([
      'VTE', 'Ventes', num, date,
      '512000', 'Caisse', '', '',
      ref, date, lib,
      montant, '0.00', '', '', date,
      montant, 'MAD'
    ].join('|'))

    ecritureNum++

    // Crédit produit
    lines.push([
      'VTE', 'Ventes', String(ecritureNum).padStart(6, '0'), date,
      '706000', 'Prestations de services', '', '',
      ref, date, lib,
      '0.00', montant, '', '', date,
      montant, 'MAD'
    ].join('|'))

    ecritureNum++
  })

  // Bons de caisse sortie → débit charge (606), crédit caisse (512)
  bons.filter(b => b.type === 'SORTIE').forEach(b => {
    const date    = formatDate(b.dateOperation)
    const ref     = b.numero
    const lib     = b.motif || 'Sortie caisse'
    const montant = parseFloat(b.montant).toFixed(2)
    const num     = String(ecritureNum).padStart(6, '0')

    lines.push([
      'ACH', 'Achats', num, date,
      '606000', 'Achats non stockes', '', '',
      ref, date, lib,
      montant, '0.00', '', '', date,
      montant, 'MAD'
    ].join('|'))

    ecritureNum++

    lines.push([
      'ACH', 'Achats', String(ecritureNum).padStart(6, '0'), date,
      '512000', 'Caisse', '', '',
      ref, date, lib,
      '0.00', montant, '', '', date,
      montant, 'MAD'
    ].join('|'))

    ecritureNum++
  })

  return lines.join('\n')
}

module.exports = {
  getRapportFinancier,
  getTauxPresence,
  getTauxReussite,
  exportFEC
}