import api from './axios'

export const actualitesApi = {
  getPublic:   (params) => api.get('/actualites', { params }),
  getAllAdmin: (params) => api.get('/actualites/admin/all', { params }),
  getById:     (id)     => api.get(`/actualites/admin/${id}`),
  create:      (data)   => api.post('/actualites', data),
  update:      (id, data) => api.put(`/actualites/${id}`, data),
  togglePublish: (id)   => api.patch(`/actualites/${id}/publish`),
  remove:      (id)     => api.delete(`/actualites/${id}`),
  updateImage: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/actualites/${id}/image`, form)
  },
}
