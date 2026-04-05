import api from './axios'

export const matieresApi = {
  getAll: (params) => api.get('/matieres', { params }),
}