import api from './axios'

export const usersApi = {
  getAll:      (params) => api.get('/users', { params }),
  getStats:    (params) => api.get('/users/stats', { params }),
  updateRole:  (id, role) => api.patch(`/users/${id}/role`, { role }),
  setActive:   (id, isActive) => api.patch(`/users/${id}/active`, { isActive }),
}
