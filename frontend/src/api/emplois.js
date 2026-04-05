import api from './axios'

export const emploisApi = {
  getAll:  (params) => api.get('/emplois', { params }),
  create:  (data)   => api.post('/emplois', data),
  remove:  (id)     => api.delete(`/emplois/${id}`),
}