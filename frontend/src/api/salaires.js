import api from './axios'

export const salairesApi = {
  getAll:  (params) => api.get('/salaires', { params }),
  getStats:(params) => api.get('/salaires/stats', { params }),
  create:  (data)   => api.post('/salaires', data),
  payer:   (id, data) => api.patch(`/salaires/${id}/payer`, data),
}