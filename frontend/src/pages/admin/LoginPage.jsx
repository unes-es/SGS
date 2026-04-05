import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

export default function LoginPage() {
  const navigate  = useNavigate()
  const { setAuth } = useAuthStore()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const { mutate: login, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      setAuth(data.accessToken, data.user)
      navigate('/admin')
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Erreur de connexion')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Email et mot de passe requis')
      return
    }
    login(form)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">

      {/* Card */}
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-2xl mb-4">
            🎓
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SGS</h1>
          <p className="text-gray-400 text-sm mt-1">Système de Gestion Scolaire</p>
        </div>

        {/* Form card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Connexion</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@sgs.ma"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm transition mt-2"
            >
              {isPending ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2026 SGS — Tous droits réservés
        </p>
      </div>
    </div>
  )
}