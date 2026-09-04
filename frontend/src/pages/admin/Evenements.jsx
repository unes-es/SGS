import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { evenementsApi } from '../../api/evenements'
import { centresApi } from '../../api/centres'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const TYPES = ['PORTES OUVERTES', 'TEST ADMISSION', 'FORUM EMPLOI', 'CONFÉRENCE', 'AUTRE']

// datetime-local inputs need "YYYY-MM-DDTHH:mm" with no timezone suffix -
// toISOString() gives that if you slice off the trailing "Z" and millis.
const toLocalInput = (iso) => iso ? new Date(iso).toISOString().slice(0, 16) : ''

export default function Evenements() {
  const { user } = useAuthStore()
  const canWrite = ['SUPER_ADMIN', 'DIRECTEUR'].includes(user?.role)
  const canDelete = user?.role === 'SUPER_ADMIN'

  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['evenements-admin', page],
    queryFn: () => evenementsApi.getAllAdmin({ page, limit: 15 }),
    keepPreviousData: true
  })
  const evenements = data?.data?.data || []
  const meta = data?.data?.meta || {}

  const { data: centresRes } = useQuery({ queryKey: ['centres'], queryFn: () => centresApi.getAll() })
  const centres = centresRes?.data?.data || []

  const invalidate = () => qc.invalidateQueries({ queryKey: ['evenements-admin'] })

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (form) => form.id ? evenementsApi.update(form.id, form) : evenementsApi.create(form),
    onSuccess: () => {
      toast.success(editing?.id ? 'Événement mis à jour' : 'Événement créé')
      invalidate()
      setEditing(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur')
  })

  const { mutate: togglePublish } = useMutation({
    mutationFn: (id) => evenementsApi.togglePublish(id),
    onSuccess: (res) => {
      toast.success(res.data.data.isPublished ? 'Événement publié' : 'Événement dépublié')
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur')
  })

  const { mutate: remove } = useMutation({
    mutationFn: (id) => evenementsApi.remove(id),
    onSuccess: () => { toast.success('Événement supprimé'); invalidate(); setConfirmDelete(null) },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur')
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Événements</h1>
          <p className="text-sm text-gray-500 mt-0.5">Agenda affiché sur le site vitrine</p>
        </div>
        {canWrite && (
          <button onClick={() => setEditing({})}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition">
            + Nouvel événement
          </button>
        )}
      </div>

      <Card>
        {isLoading ? <Spinner /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Événement</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Type</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Date</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Campus</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Statut</th>
                  {canWrite && <th className="px-5 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {evenements.map(e => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900 max-w-xs truncate">{e.titre}</div>
                      <div className="text-xs text-gray-400">{e.lieu}</div>
                    </td>
                    <td className="px-5 py-3.5"><Badge label={e.type} variant="blue" /></td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(e.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{e.centre?.nom || 'Les deux campus'}</td>
                    <td className="px-5 py-3.5">
                      <Badge label={e.isPublished ? 'Publié' : 'Brouillon'} variant={e.isPublished ? 'green' : 'gray'} />
                    </td>
                    {canWrite && (
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => togglePublish(e.id)}
                            className="text-gray-400 hover:text-blue-600 transition text-xs font-semibold">
                            {e.isPublished ? 'Dépublier' : 'Publier'}
                          </button>
                          <button onClick={() => setEditing(e)}
                            className="text-gray-400 hover:text-blue-600 transition text-xs font-semibold">
                            Modifier
                          </button>
                          {canDelete && (
                            <button onClick={() => setConfirmDelete(e)}
                              className="text-gray-400 hover:text-red-500 transition text-xs font-semibold">
                              Supprimer
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {!evenements.length && (
                  <tr>
                    <td colSpan={canWrite ? 6 : 5} className="px-5 py-16 text-center">
                      <div className="text-4xl mb-3">📅</div>
                      <div className="font-semibold text-gray-500">Aucun événement</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {meta.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">Page {meta.page} sur {meta.totalPages} · {meta.total} événements</span>
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

      {editing && (
        <EvenementModal
          evenement={editing}
          centres={centres}
          onClose={() => setEditing(null)}
          onSave={save}
          isPending={saving}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => remove(confirmDelete.id)}
        danger
        title="Supprimer cet événement"
        message={`« ${confirmDelete?.titre} » sera définitivement supprimé.`}
        confirmLabel="Supprimer"
      />
    </div>
  )
}

function EvenementModal({ evenement, centres, onClose, onSave, isPending }) {
  const [form, setForm] = useState({
    id: evenement.id,
    type: evenement.type || TYPES[0],
    titre: evenement.titre || '',
    description: evenement.description || '',
    lieu: evenement.lieu || '',
    dateDebut: toLocalInput(evenement.dateDebut) || '',
    dateFin: toLocalInput(evenement.dateFin) || '',
    centreId: evenement.centreId || '',
    isPublished: evenement.isPublished || false
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.titre.trim() && form.description.trim() && form.lieu.trim() && form.dateDebut

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">{evenement.id ? 'Modifier l\'événement' : 'Nouvel événement'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Campus</label>
              <select value={form.centreId} onChange={e => set('centreId', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option value="">Les deux campus</option>
                {centres.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Titre *</label>
            <input value={form.titre} onChange={e => set('titre', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Lieu *</label>
            <input value={form.lieu} onChange={e => set('lieu', e.target.value)} placeholder="📍 Casa · 09h–17h"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Début *</label>
              <input type="datetime-local" value={form.dateDebut} onChange={e => set('dateDebut', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fin (optionnel)</label>
              <input type="datetime-local" value={form.dateFin} onChange={e => set('dateFin', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)}
              className="rounded border-gray-300" />
            Publier immédiatement sur le site
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={() => onSave(form)} disabled={isPending || !valid}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
