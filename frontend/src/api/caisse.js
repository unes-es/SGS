import api from './axios'

export const caisseApi = {
  getStats:       (params) => api.get('/caisse/stats', { params }),
  getCaisses:     (params) => api.get('/caisse/caisses', { params }),
  getPaiements:   (params) => api.get('/caisse/paiements', { params }),
  createPaiement: (data)   => api.post('/caisse/paiements', data),
  getBons:        (params) => api.get('/caisse/bons', { params }),
  createBon:      (data)   => api.post('/caisse/bons', data),
}