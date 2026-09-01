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
}
