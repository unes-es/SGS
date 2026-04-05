import api from './axios'

export const notesApi = {
  getAll:           (params)       => api.get('/notes', { params }),
  create:           (data)         => api.post('/notes', data),
  update:           (id, data)     => api.put(`/notes/${id}`, data),
  remove:           (id)           => api.delete(`/notes/${id}`),
  getMoyenne:       (eleveId, periode) => api.get(`/notes/eleve/${eleveId}/moyenne`, { params: { periode } }),
  getMoyenneClasse: (classeId, periode) => api.get(`/notes/classe/${classeId}/moyenne`, { params: { periode } }),
}