import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { calendrierApi } from '../../api/calendrier'
import { centresApi } from '../../api/centres'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

// Academic calendar (feature addition) - holidays, vacation ranges, exam
// periods. Deliberately a flat list + inline create form rather than a
// full calendar-grid widget - the value here is "define and see what's
// coming up," not a visual month view (a real calendar UI would be a
// much bigger, separate piece of work).
const TYPE_LABELS = { FERIE: 'Jour férié', VACANCES: 'Vacances', EXAMEN: 'Examens', AUTRE: 'Autre' }
const TYPE_COLORS = { FERIE: 'red', VACANCES: 'blue', EXAMEN: 'amber', AUTRE: 'gray' }

export default function Calendrier() {
  const { user } = useAuthStore()
  const canWrite = ['SUPER_ADMIN', 'DIRECTEUR'].includes(user?.role)

  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState({ type: 'VACANCES', titre: '', dateDebut: '', dateFin: '', centreId: '' })

  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['calendrier-admin'],
    queryFn: () => calendrierApi.getAll()
  })
  const evenements = data?.data?.data || []

  const { data: centresRes } = useQuery({ queryKey: ['centres'], queryFn: () => centresApi.getAll() })
  const centres = centresRes?.data?.data || []

  const invalidate = () => qc.invalidateQueries({ queryKey: ['calendrier-admin'] })

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: () => calendrierApi.create({ ...form, centreId: form.centreId || undefined }),
    onSuccess: () => {
      invalidate()
      toast.success('Événement ajouté au calendrier')
      setForm({ type: 'VACANCES', titre: '', dateDebut: '', dateFin: '', centreId: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur')
  })

  const { mutate: remove } = useMutation({
    mutationFn: (id) => calendrierApi.remove(id),
    onSuccess: () => {
      invalidate()
      toast.success('Événement supprimé')
      setConfirmDelete(null)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.titre || !form.dateDebut || !form.dateFin) {
      toast.error('Titre, date de début et date de fin sont requis')
      return
    }
    create()
  }

  // Soonest-first, but past entries stay visible below a divider rather
  // than disappearing - useful to see what a "vacances" period already
  // covered, not just what's upcoming.
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const upcoming = evenements.filter(e => new Date(e.dateFin) >= today)
  const past = evenements.filter(e => new Date(e.dateFin) < today)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Calendrier académique</h1>
        <p className="text-sm text-gray-500 mt-0.5">Jours fériés, vacances et périodes d'examens</p>
      </div>

      {canWrite && (
        <Card>
          <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Titre</label>
              <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                placeholder="Ex: Vacances de printemps"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Début</label>
              <input type="date" value={form.dateDebut} onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Fin</label>
              <input type="date" value={form.dateFin} onChange={e => setForm(f => ({ ...f, dateFin: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Centre</label>
              <select value={form.centreId} onChange={e => setForm(f => ({ ...f, centreId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Tous les centres</option>
                {centres.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <button type="submit" disabled={creating}
              className="lg:col-span-6 sm:col-span-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2.5 transition">
              {creating ? 'Ajout...' : '+ Ajouter au calendrier'}
            </button>
          </form>
        </Card>
      )}

      {isLoading ? (
        <Spinner />
      ) : evenements.length === 0 ? (
        <Card>
          <div className="p-5 py-12 text-center">
            <div className="text-4xl mb-3">🗓️</div>
            <div className="font-semibold text-gray-500">Aucun événement dans le calendrier</div>
          </div>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <Card>
              <div className="p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-3">À venir</h2>
                <EventList items={upcoming} canWrite={canWrite} onDelete={setConfirmDelete} />
              </div>
            </Card>
          )}
          {past.length > 0 && (
            <Card>
              <div className="p-5">
                <h2 className="text-sm font-bold text-gray-400 mb-3">Passés</h2>
                <EventList items={past} canWrite={canWrite} onDelete={setConfirmDelete} dimmed />
              </div>
            </Card>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Supprimer cet événement ?"
        message={confirmDelete?.titre}
        onConfirm={() => remove(confirmDelete.id)}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function EventList({ items, canWrite, onDelete, dimmed }) {
  return (
    <div className="space-y-2">
      {items.map(e => (
        <div key={e.id} className={`flex items-center justify-between border-b border-gray-50 pb-2.5 last:border-0 ${dimmed ? 'opacity-60' : ''}`}>
          <div className="flex items-center gap-3">
            <Badge label={TYPE_LABELS[e.type]} variant={TYPE_COLORS[e.type]} />
            <div>
              <div className="text-sm font-semibold text-gray-900">{e.titre}</div>
              <div className="text-xs text-gray-400">
                {new Date(e.dateDebut).toLocaleDateString('fr-FR')} → {new Date(e.dateFin).toLocaleDateString('fr-FR')}
                {e.centre?.nom ? ` · ${e.centre.nom}` : ' · Tous les centres'}
              </div>
            </div>
          </div>
          {canWrite && (
            <button onClick={() => onDelete(e)} className="text-gray-300 hover:text-red-500 transition text-xs">🗑</button>
          )}
        </div>
      ))}
    </div>
  )
}
