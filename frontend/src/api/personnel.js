import api from './axios'

export const personnelApi = {
  getAll:     (params)     => api.get('/personnel', { params }),
  getById:    (id)         => api.get(`/personnel/${id}`),
  create:     (data)       => api.post('/personnel', data),
  update:     (id, data)   => api.put(`/personnel/${id}`, data),
  deactivate: (id)         => api.delete(`/personnel/${id}`),
}