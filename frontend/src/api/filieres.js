import api from './axios'

export const filieresApi = {
  getAll:  (params) => api.get('/filieres', { params }),
  getById: (id)     => api.get(`/filieres/${id}`),
  create:  (data)   => api.post('/filieres', data),
  update:  (id, data) => api.put(`/filieres/${id}`, data),
  remove:  (id)     => api.delete(`/filieres/${id}`),
}

export const matieresApi2 = {
  getByFiliere: (filiereId) => api.get(`/filieres/${filiereId}/matieres`),
  create:       (data)      => api.post('/matieres', data),
  update:       (id, data)  => api.put(`/matieres/${id}`, data),
  remove:       (id)        => api.delete(`/matieres/${id}`),
}

export const tarifsApi = {
  getByFiliere: (filiereId) => api.get(`/filieres/${filiereId}/tarifs`),
  upsert: (filiereId, typeFormation, fraisScolarite) =>
    api.put(`/filieres/${filiereId}/tarifs/${typeFormation}`, { fraisScolarite }),
  reset: (filiereId, typeFormation) =>
    api.delete(`/filieres/${filiereId}/tarifs/${typeFormation}`),
}