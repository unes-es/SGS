import api from './axios'

export const candidaturesApi = {
  getAll:       (params) => api.get('/candidatures', { params }),
  getById:      (id)     => api.get(`/candidatures/${id}`),
  getStats:     (params) => api.get('/candidatures/stats', { params }),
  updateStatut: (id, data) => api.patch(`/candidatures/${id}/statut`, data),
  create:       (data) => api.post('/candidatures/public', data),

  getDocuments:  (id) => api.get(`/candidatures/${id}/documents`),
  getEvenements: (id) => api.get(`/candidatures/${id}/evenements`),
  addMessage:    (id, message) => api.post(`/candidatures/${id}/evenements`, { message }),
  addDocument:   (id, file, type) => {
    const form = new FormData()
    form.append('type', type)
    form.append('file', file)
    return api.post(`/candidatures/${id}/documents`, form)
  },

  updateStatutBulk: (ids, statut) => api.patch('/candidatures/bulk/statut', { ids, statut }),
  exportCsv: (params) => api.get('/candidatures/export', { params, responseType: 'blob' }),
}