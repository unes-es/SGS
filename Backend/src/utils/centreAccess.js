// Cross-centre isolation guard for single-record read/write endpoints.
//
// Every module's `getAll` already scopes its `where` clause by the
// caller's centreId (see CLAUDE.md's multi-centre isolation note), but
// the single-record getById/update/delete/etc. endpoints never checked
// that the record being fetched actually belongs to the caller's own
// centre - a DIRECTEUR/SECRETAIRE/COMPTABLE/PROFESSEUR who knew or
// guessed a UUID from another campus could read or modify it regardless.
// This is the shared fix, applied consistently across personnel, eleves,
// classes, absences, notes, salaires, filieres and documents.
//
// 404, not 403, on purpose: telling a non-SUPER_ADMIN caller "this exists
// but isn't yours" (403) confirms the id is valid and leaks that another
// centre has a record there. A plain 404 is indistinguishable from the id
// simply not existing at all, which is the same signal a typo would give.
function assertSameCentre(recordCentreId, user, notFoundMessage = 'Ressource non trouvée') {
  if (!user || user.role === 'SUPER_ADMIN') return
  if (recordCentreId !== user.centreId) {
    throw { statusCode: 404, message: notFoundMessage }
  }
}

module.exports = { assertSameCentre }
