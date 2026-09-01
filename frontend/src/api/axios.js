import axios from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
})

// attach token to every request
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// auto refresh on 401 + global error handling
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config

    // try refresh on 401
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        useAuthStore.getState().setAccessToken(data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        // Portal (CANDIDAT/ETUDIANT) sessions must bounce to their own
        // login, not the admin one - this interceptor is shared by both
        // apps (see App.jsx), so it can't assume the caller was staff.
        const isPortalUser = ['CANDIDAT', 'ETUDIANT'].includes(useAuthStore.getState().user?.role)
        useAuthStore.getState().logout()
        window.location.href = isPortalUser ? '/candidat/login' : '/admin/login'
        return Promise.reject(err)
      }
    }

    // global error toast (skip 401 — handled above)
    if (err.response?.status !== 401) {
      const message = err.response?.data?.message || 'Une erreur est survenue'
      toast.error(message)
    }

    return Promise.reject(err)
  }
)

export default api