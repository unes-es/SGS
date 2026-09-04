import api from './axios'

export const evenementsApi = {
  getPublic:   (params) => api.get('/evenements', { params }),
  getAllAdmin: (params) => api.get('/evenements/admin/all', { params }),
  getById:     (id)     => api.get(`/evenements/admin/${id}`),
  create:      (data)   => api.post('/evenements', data),
  update:      (id, data) => api.put(`/evenements/${id}`, data),
  togglePublish: (id)   => api.patch(`/evenements/${id}/publish`),
  remove:      (id)     => api.delete(`/evenements/${id}`),
}
