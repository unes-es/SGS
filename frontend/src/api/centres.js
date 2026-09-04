import api from './axios'

export const centresApi = {
  getAll: (params) => api.get('/centres', { params }),
  getAllAdmin: () => api.get('/centres/admin/all'),
  getById: (id) => api.get(`/centres/${id}`),
  create: (data) => api.post('/centres', data),
  update: (id, data) => api.put(`/centres/${id}`, data),
  // Deactivation goes through DELETE (soft: sets isActive false server-side)
  // rather than PUT { isActive: false } - centres.routes.js deliberately
  // gates DELETE to SUPER_ADMIN only, stricter than PUT's SUPER_ADMIN +
  // DIRECTEUR, so routing deactivation through PUT instead would quietly
  // let a DIRECTEUR deactivate a whole campus. Reactivating is a PUT
  // (DIRECTEUR-allowed, same as any other centre edit).
  deactivate: (id) => api.delete(`/centres/${id}`),
  updateLogo: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    // No explicit Content-Type here - axios sets multipart/form-data with
    // the correct boundary itself when the body is a FormData instance;
    // overriding it manually strips that boundary and breaks parsing.
    return api.post(`/centres/${id}/logo`, form)
  },
}
