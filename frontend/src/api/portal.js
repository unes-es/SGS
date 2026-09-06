import api from './axios'

export const portalApi = {
  getMyCandidature: () => api.get('/portal/candidature'),
  getMyEleve:        () => api.get('/portal/eleve'),

  getMyDocuments:   () => api.get('/portal/candidature/documents'),
  addMyDocument:    (file, type) => {
    const form = new FormData()
    form.append('type', type)
    form.append('file', file)
    return api.post('/portal/candidature/documents', form)
  },
  getMyEvenements:  () => api.get('/portal/candidature/evenements'),
  addMyMessage:     (message) => api.post('/portal/candidature/evenements', { message }),

  getMyNotes:          () => api.get('/portal/eleve/notes'),
  getMyAbsences:       () => api.get('/portal/eleve/absences'),
  getMyEmploiDuTemps:  () => api.get('/portal/eleve/emploi'),
  getMyPaiements:      () => api.get('/portal/eleve/paiements'),
  getMyEleveDocuments: () => api.get('/portal/eleve/documents'),
  getMyEleveDocumentPdf: (id) => api.get(`/portal/eleve/documents/${id}/pdf`, { responseType: 'blob' }),

  // Parent portal (feature addition) - every call below takes eleveId
  // explicitly since a PARENT can have more than one child, unlike the
  // ETUDIANT calls above which always resolve to the caller's own single
  // record.
  getMyChildren:        () => api.get('/portal/enfants'),
  getChildNotes:        (eleveId) => api.get(`/portal/enfants/${eleveId}/notes`),
  getChildAbsences:     (eleveId) => api.get(`/portal/enfants/${eleveId}/absences`),
  getChildEmploiDuTemps:(eleveId) => api.get(`/portal/enfants/${eleveId}/emploi`),
  getChildPaiements:    (eleveId) => api.get(`/portal/enfants/${eleveId}/paiements`),
  getChildDocuments:    (eleveId) => api.get(`/portal/enfants/${eleveId}/documents`),
  getChildDocumentPdf:  (eleveId, docId) => api.get(`/portal/enfants/${eleveId}/documents/${docId}/pdf`, { responseType: 'blob' }),
}
