import api from './axios'

export const absencesApi = {
  getAll:   (params) => api.get('/absences', { params }),
  getStats: ()       => api.get('/absences/stats'),
  create:   (data)   => api.post('/absences', data),
  justify:  (id, data) => api.patch(`/absences/${id}/justify`, data),
  remove:   (id)     => api.delete(`/absences/${id}`),
}