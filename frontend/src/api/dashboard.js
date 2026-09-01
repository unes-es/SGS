import api from './axios'

export const dashboardApi = {
  getAbsencesStats:     (params) => api.get('/absences/stats', { params }),
  getCaisseStats:       (params) => api.get('/caisse/stats', { params }),
  getEleves:            (params) => api.get('/eleves', { params: { limit: 5, ...params } }),
  getAbsences:          (params) => api.get('/absences', { params: { limit: 5, ...params } }),
  getRevenueChart:      (params) => api.get('/caisse/revenue-chart', { params }),
  getElevesParFiliere:  (params) => api.get('/filieres/stats/eleves-par-filiere', { params }),
}
