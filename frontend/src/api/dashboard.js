import api from './axios'

export const dashboardApi = {
  getAbsencesStats: () => api.get('/absences/stats'),
  getCaisseStats:   () => api.get('/caisse/stats'),
  getEleves:        () => api.get('/eleves?limit=5'),
  getAbsences:      () => api.get('/absences?limit=5'),
}