import api from './axios'

export const elevesApi = {
  getAll:       (params) => api.get('/eleves', { params }),
  getById:      (id)     => api.get(`/eleves/${id}`),
  create:       (data)   => api.post('/eleves', data),
  update:       (id, data) => api.put(`/eleves/${id}`, data),
  updateStatut: (id, statut) => api.patch(`/eleves/${id}/statut`, { statut }),
}