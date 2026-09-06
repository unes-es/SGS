import api from './axios'

export const elevesApi = {
  getAll:       (params) => api.get('/eleves', { params }),
  getById:      (id)     => api.get(`/eleves/${id}`),
  create:       (data)   => api.post('/eleves', data),
  update:       (id, data) => api.put(`/eleves/${id}`, data),
  updateStatut: (id, statut) => api.patch(`/eleves/${id}/statut`, { statut }),
  // Bulk import (feature addition)
  import: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/eleves/import', form)
  },
  // Parent portal (feature addition)
  linkParent:   (id, data) => api.post(`/eleves/${id}/parent`, data),
  unlinkParent: (id)       => api.delete(`/eleves/${id}/parent`),
}