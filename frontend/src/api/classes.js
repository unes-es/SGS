import api from './axios'

export const classesApi = {
  getAll: (params) => api.get('/classes', { params }),
  create: (data) => api.post('/classes', data),
  getById: (id) => api.get(`/classes/${id}`),
  update: (id, data) => api.put(`/classes/${id}`, data),
  remove: (id) => api.delete(`/classes/${id}`),
}