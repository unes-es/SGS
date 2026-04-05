import api from './axios'

export const caisseApi = {
  getStats:       ()       => api.get('/caisse/stats'),
  getCaisses:     ()       => api.get('/caisse/caisses'),
  getPaiements:   (params) => api.get('/caisse/paiements', { params }),
  createPaiement: (data)   => api.post('/caisse/paiements', data),
  getBons:        (params) => api.get('/caisse/bons', { params }),
  createBon:      (data)   => api.post('/caisse/bons', data),
}