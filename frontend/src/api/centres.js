import api from './axios'

export const centresApi = {
  getAll: (params) => api.get('/centres', { params }),
  getById: (id) => api.get(`/centres/${id}`),
  update: (id, data) => api.put(`/centres/${id}`, data),
  updateLogo: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    // No explicit Content-Type here - axios sets multipart/form-data with
    // the correct boundary itself when the body is a FormData instance;
    // overriding it manually strips that boundary and breaks parsing.
    return api.post(`/centres/${id}/logo`, form)
  },
}
