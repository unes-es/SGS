import api from './axios'

export const candidaturesApi = {
  getAll:       (params) => api.get('/candidatures', { params }),
  getById:      (id)     => api.get(`/candidatures/${id}`),
  getStats:     ()       => api.get('/candidatures/stats'),
  updateStatut: (id, data) => api.patch(`/candidatures/${id}/statut`, data),
  create:       (data) => api.post('/candidatures/public', data),
}