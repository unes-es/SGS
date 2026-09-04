import api from './axios'

export const contactApi = {
  create:  (data) => api.post('/contact', data),
  getAll:  (params) => api.get('/contact', { params }),
  marquerTraite: (id) => api.patch(`/contact/${id}/traiter`),
}
