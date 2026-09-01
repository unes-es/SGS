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

const candidaturesService = require('../candidatures/candidatures.service')

// Every document/message function below re-resolves the caller's own
// candidature id first (via getMyCandidature, which already throws 404 if
// there is none) rather than trusting a candidatureId from the request -
// same "small, obviously-correct surface" reasoning as the file banner
// above. It's an extra query per call, but this endpoint is never hot
// enough for that to matter, and it's the difference between "provably
// can't touch someone else's candidature" and "trusts the caller".

async function getMyDocuments(userId) {
  const candidature = await getMyCandidature(userId)
  return candidaturesService.getDocuments(candidature.id)
}

async function addMyDocument(userId, fileData) {
  const candidature = await getMyCandidature(userId)
  return candidaturesService.addDocument(candidature.id, fileData)
}

async function getMyEvenements(userId) {
  const candidature = await getMyCandidature(userId)
  return candidaturesService.getEvenements(candidature.id)
}

async function addMyMessage(userId, message) {
  const candidature = await getMyCandidature(userId)
  return candidaturesService.addMessage(candidature.id, {
    message, auteurId: userId, auteurRole: 'CANDIDAT'
  })
}

module.exports = {
  getMyCandidature, getMyEleve,
  getMyDocuments, addMyDocument, getMyEvenements, addMyMessage
}
