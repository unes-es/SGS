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

// Sprint 3 (Phase 2.2) - Student Portal. Every function here resolves the
// caller's own eleve record first via getMyEleve (404s if there is none,
// e.g. a CANDIDAT hitting these by mistake), same "resolve the caller's
// own record, never trust an id from the request" pattern as the
// candidature functions above.

async function getMyNotes(userId) {
  const eleve = await getMyEleve(userId)
  return prisma.note.findMany({
    where: { eleveId: eleve.id },
    include: { matiere: { select: { nom: true } } },
    orderBy: [{ periode: 'desc' }, { dateEval: 'desc' }]
  })
}

async function getMyAbsences(userId) {
  const eleve = await getMyEleve(userId)
  return prisma.absence.findMany({
    where: { eleveId: eleve.id },
    include: { matiere: { select: { nom: true } } },
    orderBy: { dateAbsence: 'desc' }
  })
}

// Not the élève's own record - the weekly schedule for their whole classe,
// since that's what an emploi du temps actually is. Still scoped safely:
// classeId comes from the caller's own eleve record, not the request.
async function getMyEmploiDuTemps(userId) {
  const eleve = await getMyEleve(userId)
  return prisma.emploiDuTemps.findMany({
    where: { classeId: eleve.classeId },
    include: {
      matiere: { select: { nom: true } },
      // prenom/nom live on Utilisateur, not Personnel itself - see
      // CLAUDE.md's "field placement gotcha" note for the same split.
      professeur: { select: { utilisateur: { select: { prenom: true, nom: true } } } }
    },
    orderBy: [{ jourSemaine: 'asc' }, { heureDebut: 'asc' }]
  })
}

async function getMyPaiements(userId) {
  const eleve = await getMyEleve(userId)
  return prisma.paiementEleve.findMany({
    where: { eleveId: eleve.id },
    orderBy: { datePaiement: 'desc' }
  })
}

// Generated documents (attestations, bulletins, relevés, reçus) - the
// `Document` model, not `CandidatureDocument` above. Read-only: an élève
// can view/download what staff generated, never create or delete one.
async function getMyEleveDocuments(userId) {
  const eleve = await getMyEleve(userId)
  return prisma.document.findMany({
    where: { eleveId: eleve.id },
    orderBy: { createdAt: 'desc' }
  })
}

const documentsService = require('../documents/documents.service')

// documents.service.js's getById()/generatePdf() now take an optional
// `user` and centre-check when one is passed (see centreAccess.js) - but
// that's a centre-level check, staff-shaped (SUPER_ADMIN vs one centre).
// It's not enough for the portal: an ETUDIANT passing an arbitrary
// document id from their OWN centre must still not be able to pull
// another élève's attestation. Deliberately not passing `user` through to
// documentsService here (student sessions aren't staff and don't carry
// a centre override the same way) - this wrapper's own ownership check
// below, against the caller's own eleve record specifically, is strictly
// tighter than a centre-level check would be anyway.
async function getMyEleveDocumentPdf(userId, documentId) {
  const eleve = await getMyEleve(userId)
  const doc = await documentsService.getById(documentId)
  if (doc.eleveId !== eleve.id) {
    // 404, not 403 - don't confirm to the caller that a document with
    // this id exists at all if it isn't theirs.
    throw { statusCode: 404, message: 'Document non trouvé' }
  }
  return documentsService.generatePdf(documentId)
}

// ── Parent Portal (feature addition) ────────────────────────────────
//
// A parent can have more than one child, unlike ETUDIANT above (exactly
// one own record) - so every function here takes an explicit eleveId
// and verifies it's actually one of the caller's own children first via
// assertOwnChild, rather than resolving a single implicit record. Same
// "provably can't touch someone else's data" posture as the rest of
// this file, just shaped for a one-to-many relationship instead of
// one-to-one.

async function getMyChildren(userId) {
  return prisma.eleve.findMany({
    where: { parentUserId: userId },
    include: {
      utilisateur: { select: { prenom: true, nom: true } },
      classe: { include: { filiere: { select: { nom: true } } } }
    },
    orderBy: { createdAt: 'asc' }
  })
}

async function assertOwnChild(userId, eleveId) {
  const eleve = await prisma.eleve.findFirst({ where: { id: eleveId, parentUserId: userId } })
  // 404, not 403 - don't confirm to the caller that an élève with this
  // id exists at all if it isn't their own child, same reasoning as
  // getMyEleveDocumentPdf() below.
  if (!eleve) throw { statusCode: 404, message: 'Élève non trouvé' }
  return eleve
}

async function getChildNotes(userId, eleveId) {
  await assertOwnChild(userId, eleveId)
  return prisma.note.findMany({
    where: { eleveId },
    include: { matiere: { select: { nom: true } } },
    orderBy: [{ periode: 'desc' }, { dateEval: 'desc' }]
  })
}

async function getChildAbsences(userId, eleveId) {
  await assertOwnChild(userId, eleveId)
  return prisma.absence.findMany({
    where: { eleveId },
    include: { matiere: { select: { nom: true } } },
    orderBy: { dateAbsence: 'desc' }
  })
}

async function getChildEmploiDuTemps(userId, eleveId) {
  const eleve = await assertOwnChild(userId, eleveId)
  return prisma.emploiDuTemps.findMany({
    where: { classeId: eleve.classeId },
    include: {
      matiere: { select: { nom: true } },
      professeur: { select: { utilisateur: { select: { prenom: true, nom: true } } } }
    },
    orderBy: [{ jourSemaine: 'asc' }, { heureDebut: 'asc' }]
  })
}

async function getChildPaiements(userId, eleveId) {
  await assertOwnChild(userId, eleveId)
  return prisma.paiementEleve.findMany({
    where: { eleveId },
    orderBy: { datePaiement: 'desc' }
  })
}

async function getChildDocuments(userId, eleveId) {
  await assertOwnChild(userId, eleveId)
  return prisma.document.findMany({
    where: { eleveId },
    orderBy: { createdAt: 'desc' }
  })
}

async function getChildDocumentPdf(userId, eleveId, documentId) {
  await assertOwnChild(userId, eleveId)
  const doc = await documentsService.getById(documentId)
  if (doc.eleveId !== eleveId) {
    throw { statusCode: 404, message: 'Document non trouvé' }
  }
  return documentsService.generatePdf(documentId)
}

module.exports = {
  getMyCandidature, getMyEleve,
  getMyDocuments, addMyDocument, getMyEvenements, addMyMessage,
  getMyNotes, getMyAbsences, getMyEmploiDuTemps, getMyPaiements,
  getMyEleveDocuments, getMyEleveDocumentPdf,
  getMyChildren, getChildNotes, getChildAbsences, getChildEmploiDuTemps,
  getChildPaiements, getChildDocuments, getChildDocumentPdf
}
