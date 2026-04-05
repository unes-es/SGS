import api from './axios'

export const authApi = {
  login:   (credentials) => api.post('/auth/login', credentials),
  refresh: ()            => api.post('/auth/refresh'),
  logout:  ()            => api.post('/auth/logout'),
  me:      ()            => api.get('/auth/me')
}