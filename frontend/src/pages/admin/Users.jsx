import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../../api/users'
import { useAuthStore } from '../../store/authStore'
import { useCentreStore } from '../../store/centreStore'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import StatCard from '../../components/ui/StatCard'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

// Every login-capable role in the system (Role enum in schema.prisma).
// STAFF_ROLES are the ones this page's "Rôle" dropdown may assign - see
// users.service.js's updateRole() for the same allow-list enforced
// server-side. SUPER_ADMIN is assignable here (unlike Personnel's own
// role selector, which deliberately excludes it) - this page is meant to
// be the one deliberate place that happens.
const STAFF_ROLES = ['SUPER_ADMIN', 'DIRECTEUR', 'COMPTABLE', 'SECRETAIRE', 'PROFESSEUR']
const ALL_ROLES = [...STAFF_ROLES, 'PARENT', 'CANDIDAT', 'ETUDIANT']

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin', DIRECTEUR: 'Directeur', COMPTABLE: 'Comptable',
  SECRETAIRE: 'Secrétaire', PROFESSEUR: 'Professeur', PARENT: 'Parent',
  CANDIDAT: 'Candidat', ETUDIANT: 'Étudiant'
}
const ROLE_COLORS = {
  SUPER_ADMIN: 'red', DIRECTEUR: 'violet', COMPTABLE: 'amber',
  SECRETAIRE: 'blue', PROFESSEUR: 'green', PARENT: 'gray',
  CANDIDAT: 'amber', ETUDIANT: 'blue'
}

export default function Users() {
  const { user: currentUser } = useAuthStore()
  const { selectedCentreId } = useCentreStore()
  const centreId = selectedCentreId || undefined
  const canManage = currentUser?.role === 'SUPER_ADMIN'

  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [isActive, setIsActive] = useState('true')
  const [page, setPage] = useState(1)
  const [roleTarget, setRoleTarget] = useState(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState(null)

  const qc = useQueryClient()

  const { data: statsRes } = useQuery({
    queryKey: ['users-stats', centreId],
    queryFn: () => usersApi.getStats({ centreId })
  })
  const stats = statsRes?.data?.data || {}
  const totalStaff = STAFF_ROLES.reduce((s, r) => s + (stats[r] || 0), 0)
  const totalExternal = (stats.CANDIDAT || 0) + (stats.ETUDIANT || 0)

  const { data, isLoading } = useQuery({
    queryKey: ['users', { search, role, isActive, page, centreId }],
    queryFn: () => usersApi.getAll({ search, role, isActive, page, limit: 15, centreId }),
    keepPreviousData: true
  })
  const users = data?.data?.data || []
  const meta = data?.data?.meta || {}

  const { mutate: updateRole, isPending: roleUpdating } = useMutation({
    mutationFn: ({ id, role: newRole }) => usersApi.updateRole(id, newRole),
    onSuccess: () => {
      toast.success('Rôle mis à jour')
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['users-stats'] })
      setRoleTarget(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur')
  })

  const { mutate: setActive } = useMutation({
    mutationFn: ({ id, active }) => usersApi.setActive(id, active),
    onSuccess: (_, variables) => {
      toast.success(variables.active ? 'Compte réactivé' : 'Compte désactivé')
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['users-stats'] })
      setConfirmDeactivate(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur')
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Utilisateurs</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tous les comptes de connexion — accès et statut</p>
      </div>

      {!canManage && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg px-4 py-2.5">
          Lecture seule — seul un Super Admin peut modifier un rôle ou désactiver un compte.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" bg="bg-gray-50" label="Total actifs" value={totalStaff + totalExternal + (stats.PARENT || 0)} />
        <StatCard icon="🛡️" bg="bg-red-50" label="Super Admin" value={stats.SUPER_ADMIN || 0} />
        <StatCard icon="🏫" bg="bg-blue-50" label="Personnel" value={totalStaff - (stats.SUPER_ADMIN || 0)} />
        <StatCard icon="🎓" bg="bg-amber-50" label="Candidats & Élèves" value={totalExternal} />
      </div>

      <div className="flex gap-2 lg:gap-3 flex-wrap">
        <input
          type="text"
          placeholder="🔍 Nom, email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:border-blue-500 transition"
        />
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          <option value="">Tous les rôles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <select value={isActive} onChange={e => { setIsActive(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          <option value="true">Actifs</option>
          <option value="false">Désactivés</option>
        </select>
      </div>

      <Card>
        {isLoading ? <Spinner /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Compte</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Rôle</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Lié à</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Dernière connexion</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Statut</th>
                  {canManage && <th className="px-5 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{u.prenom} {u.nom}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={ROLE_LABELS[u.role] || u.role} variant={ROLE_COLORS[u.role] || 'gray'} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {u.personnel?.poste || (u.eleve?.matricule ? `Matricule ${u.eleve.matricule}` : '—')}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fr-FR') : 'Jamais'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={u.isActive ? 'Actif' : 'Désactivé'} variant={u.isActive ? 'green' : 'red'} />
                    </td>
                    {canManage && (
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2 justify-end">
                          {STAFF_ROLES.includes(u.role) && (
                            <button onClick={() => setRoleTarget(u)}
                              className="text-gray-400 hover:text-blue-600 transition text-xs font-semibold">
                              Rôle
                            </button>
                          )}
                          <button onClick={() => setConfirmDeactivate(u)}
                            className={`text-xs font-semibold transition ${u.isActive ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-emerald-600'}`}>
                            {u.isActive ? 'Désactiver' : 'Réactiver'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="px-5 py-16 text-center">
                      <div className="text-4xl mb-3">👥</div>
                      <div className="font-semibold text-gray-500">Aucun utilisateur trouvé</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {meta.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Page {meta.page} sur {meta.totalPages} · {meta.total} comptes
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                    ← Préc.
                  </button>
                  <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                    className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                    Suiv. →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {roleTarget && (
        <RoleModal
          user={roleTarget}
          onClose={() => setRoleTarget(null)}
          onSave={(newRole) => updateRole({ id: roleTarget.id, role: newRole })}
          isPending={roleUpdating}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={() => setActive({ id: confirmDeactivate.id, active: !confirmDeactivate.isActive })}
        danger={confirmDeactivate?.isActive}
        title={confirmDeactivate?.isActive ? 'Désactiver ce compte' : 'Réactiver ce compte'}
        message={
          confirmDeactivate?.isActive
            ? `${confirmDeactivate?.prenom} ${confirmDeactivate?.nom} ne pourra plus se connecter à SGS.`
            : `${confirmDeactivate?.prenom} ${confirmDeactivate?.nom} pourra de nouveau se connecter.`
        }
        confirmLabel="Confirmer"
      />
    </div>
  )
}

function RoleModal({ user, onClose, onSave, isPending }) {
  const [role, setRole] = useState(user.role)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Modifier le rôle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">{user.prenom} {user.nom} · {user.email}</p>
          <select value={role} onChange={e => setRole(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
            {STAFF_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          {role === 'SUPER_ADMIN' && (
            <p className="text-xs text-red-500">Accès complet à tous les centres et fonctionnalités.</p>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={() => onSave(role)} disabled={isPending || role === user.role}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {isPending ? 'Enregistrement...' : 'Confirmer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
