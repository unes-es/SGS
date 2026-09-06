import api from './axios'

export const calendrierApi = {
  getAll:  (params)   => api.get('/calendrier', { params }),
  getById: (id)       => api.get(`/calendrier/${id}`),
  create:  (data)     => api.post('/calendrier', data),
  update:  (id, data) => api.put(`/calendrier/${id}`, data),
  remove:  (id)       => api.delete(`/calendrier/${id}`),
}
