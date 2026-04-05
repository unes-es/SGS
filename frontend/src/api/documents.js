import api from './axios'

export const documentsApi = {
  getAll:     (params) => api.get('/documents', { params }),
  getByEleve: (eleveId) => api.get(`/documents/eleve/${eleveId}`),
  create:     (data)   => api.post('/documents', data),
  remove:     (id)     => api.delete(`/documents/${id}`),
}