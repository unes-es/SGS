import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'

// Shared between the admin panel (Sidebar's user block) and the
// candidat/étudiant portal (PortailPage's header) - every logged-in role
// gets the same self-service "edit my info / change my password" modal,
// since neither surface had any way to do either before this (only an
// admin could edit someone else's info, and the only password-change path
// was the logged-out forgot-password email link).
export default function MonCompteModal({ onClose }) {
  const { user, updateUser } = useAuthStore()
  const [tab, setTab] = useState('profil')

  const [profil, setProfil] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    telephone: user?.telephone || '',
    email: user?.email || ''
  })
  const setProfilField = (k, v) => setProfil(f => ({ ...f, [k]: v }))

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const setPwdField = (k, v) => setPwd(f => ({ ...f, [k]: v }))

  const { mutate: saveProfil, isPending: savingProfil } = useMutation({
    mutationFn: () => authApi.updateMe(profil),
    onSuccess: (res) => {
      updateUser(res.data.user)
      toast.success('Informations mises à jour')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur')
  })

  const { mutate: savePwd, isPending: savingPwd } = useMutation({
    mutationFn: () => authApi.changePassword(pwd.currentPassword, pwd.newPassword),
    onSuccess: () => {
      toast.success('Mot de passe mis à jour')
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur')
  })

  const profilValid = profil.prenom.trim() && profil.nom.trim() && profil.email.trim()
  const pwdValid = pwd.currentPassword && pwd.newPassword.length >= 6 && pwd.newPassword === pwd.confirmPassword

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">Mon compte</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="flex border-b border-gray-100 px-6">
          {[['profil', 'Informations'], ['password', 'Mot de passe']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-3 py-2.5 text-sm font-semibold border-b-2 transition ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'profil' ? (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Prénom *</label>
                <input value={profil.prenom} onChange={e => setProfilField('prenom', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nom *</label>
                <input value={profil.nom} onChange={e => setProfilField('nom', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
              <input type="email" value={profil.email} onChange={e => setProfilField('email', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Téléphone</label>
              <input value={profil.telephone} onChange={e => setProfilField('telephone', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <button onClick={() => saveProfil()} disabled={savingProfil || !profilValid}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {savingProfil ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mot de passe actuel *</label>
              <input type="password" value={pwd.currentPassword} onChange={e => setPwdField('currentPassword', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nouveau mot de passe *</label>
              <input type="password" value={pwd.newPassword} onChange={e => setPwdField('newPassword', e.target.value)}
                placeholder="6 caractères minimum"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirmer le nouveau mot de passe *</label>
              <input type="password" value={pwd.confirmPassword} onChange={e => setPwdField('confirmPassword', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              {pwd.confirmPassword && pwd.newPassword !== pwd.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas.</p>
              )}
            </div>
            <button onClick={() => savePwd()} disabled={savingPwd || !pwdValid}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {savingPwd ? 'Enregistrement...' : 'Changer le mot de passe'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
