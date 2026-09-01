import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

// Deliberately its own page, not a reskin of admin's LoginPage - this is
// external, public-facing (candidates/students, not staff), so it matches
// the light public-site look rather than the dark admin theme. Same
// underlying /auth/login endpoint and useAuthStore either way - only the
// styling and post-login destination differ.
export default function CandidatLoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const { mutate: login, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      setAuth(data.accessToken, data.user)
      navigate('/portail')
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur de connexion')
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white text-xl mb-3">
            🎓
          </div>
          <h1 className="text-xl font-bold text-gray-900">Espace Candidat</h1>
          <p className="text-gray-500 text-sm mt-1">SGS — Suivi de votre candidature</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mot de passe</label>
              <input type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <button type="submit" disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition mt-1">
              {isPending ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <Link to="/forgot-password" className="block text-center text-xs text-blue-600 hover:text-blue-700 mt-4">
            Mot de passe oublié ?
          </Link>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Vous avez soumis une candidature ? Vos identifiants vous ont été envoyés par email.
        </p>
      </div>
    </div>
  )
}
