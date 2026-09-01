import api from './axios'

export const authApi = {
  login:   (credentials) => api.post('/auth/login', credentials),
  refresh: ()            => api.post('/auth/refresh'),
  logout:  ()            => api.post('/auth/logout'),
  me:      ()            => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:  (token, password) => api.post('/auth/reset-password', { token, password }),
}
