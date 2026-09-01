import api from './axios'

export const centresApi = {
  getAll: (params) => api.get('/centres', { params }),
}
