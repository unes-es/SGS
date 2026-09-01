import api from './axios'

export const portalApi = {
  getMyCandidature: () => api.get('/portal/candidature'),
  getMyEleve:        () => api.get('/portal/eleve'),
}
