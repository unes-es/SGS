const prisma = require('../../config/db')

// Deliberately its own module, not an ETUDIANT/CANDIDAT branch bolted onto
// the existing admin controllers (eleves/candidatures/notes/...). This is
// external, self-service access to a minor's/candidate's own data - every
// query here is scoped by the caller's own userId, not an id from the
// request, so there's no path that could return someone else's data by
// mistake. A small, obviously-correct surface on purpose.

// The logged-in CANDIDAT's most recent candidature - "most recent" since
// linkCandidatAccount() (candidatures.service.js) lets one account
// accumulate more than one submission over time (e.g. reapplying).
async function getMyCandidature(userId) {
  const candidature = await prisma.candidature.findFirst({
    where: { candidatUserId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      filiere: { select: { nom: true } },
      centre:  { select: { nom: true, ville: true } }
    }
  })
  if (!candidature) throw { statusCode: 404, message: 'Aucune candidature trouvée' }
  return candidature
}

// The logged-in ETUDIANT's own élève record - just enough for a landing
// dashboard (Sprint 1/early Sprint 3); notes/absences/emploi du
// temps/paiements views are the rest of Sprint 3, not built yet.
async function getMyEleve(userId) {
  const eleve = await prisma.eleve.findUnique({
    where: { utilisateurId: userId },
    include: {
      utilisateur: { select: { prenom: true, nom: true, email: true } },
      classe: { include: { filiere: { select: { nom: true } } } }
    }
  })
  if (!eleve) throw { statusCode: 404, message: 'Dossier élève non trouvé' }
  return eleve
}

module.exports = { getMyCandidature, getMyEleve }
