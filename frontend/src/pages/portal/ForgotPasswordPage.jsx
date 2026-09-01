import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.forgotPassword(email),
    // The backend always answers the same way whether or not the email
    // exists (see auth.service.js) - the frontend just shows "sent"
    // unconditionally too, same account-enumeration reasoning end to end.
    onSuccess: () => setSent(true),
    onError: () => setSent(true)
  })

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-lg font-bold text-gray-900 mb-1">Mot de passe oublié</h1>
          {sent ? (
            <p className="text-sm text-gray-600 mt-3">
              Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">Recevez un lien pour choisir un nouveau mot de passe.</p>
              <form onSubmit={e => { e.preventDefault(); mutate() }} className="space-y-3">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com" required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                <button type="submit" disabled={isPending}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition">
                  {isPending ? 'Envoi...' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          )}
          <Link to="/candidat/login" className="block text-center text-xs text-blue-600 hover:text-blue-700 mt-4">
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}
