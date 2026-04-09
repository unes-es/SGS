import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classesApi } from '../../api/classes'
import { filieresApi } from '../../api/filieres'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

function ClasseModal({ classe, onClose, centreId }) {
  const qc = useQueryClient()
  const isEdit = !!classe

  const [form, setForm] = useState({
    nom: classe?.nom || '',
    filiereId: classe?.filiereId || '',
    anneeScolaire: classe?.anneeScolaire || '2025-2026',
    capaciteMax: classe?.capaciteMax || 30,
    niveau: classe?.niveau || '',
    salle: classe?.salle || '',
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data: filieresRes } = useQuery({
    queryKey: ['filieres'],
    queryFn: filieresApi.getAll
  })
  const filieres = filieresRes?.data?.data || []

  const { mutate, isPending } = useMutation({
    mutationFn: isEdit
      ? (data) => classesApi.update(classe.id, data)
      : (data) => classesApi.create({ ...data, centreId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      toast.success(isEdit ? 'Classe modifiée' : 'Classe créée')
      onClose()
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Erreur')
    }
  })

  const handleSubmit = () => {
    if (!form.nom || !form.filiereId) {
      setError('Nom et filière sont requis')
      return
    }
    setError('')
    mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Modifier classe' : 'Nouvelle classe'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>
          )}

          <Field label="Nom de la classe *" value={form.nom} onChange={v => set('nom', v)} placeholder="BTS-INFO-1A" />

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Filière *</label>
            <select value={form.filiereId} onChange={e => set('filiereId', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="">Choisir une filière</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Année scolaire" value={form.anneeScolaire} onChange={v => set('anneeScolaire', v)} />
            <Field label="Capacité max" type="number" value={form.capaciteMax} onChange={v => set('capaciteMax', v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Niveau" value={form.niveau} onChange={v => set('niveau', v)} placeholder="1ère année" />
            <Field label="Salle" value={form.salle} onChange={v => set('salle', v)} placeholder="Salle A1" />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {isPending ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
      />
    </div>
  )
}

export default function Classes() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [filiereId, setFiliereId] = useState('')

  const [search, setSearch] = useState('')

  const { data: filieresRes } = useQuery({
    queryKey: ['filieres'],
    queryFn: filieresApi.getAll
  })

  const { data, isLoading } = useQuery({
    queryKey: ['classes', { filiereId }],
    queryFn: () => classesApi.getAll({ filiereId }),
  })

  const { mutate: remove } = useMutation({
    mutationFn: (id) => classesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Classe supprimée')
    },
  })

  const filieres = filieresRes?.data?.data || []
  const classes = (data?.data?.data || []).filter(c =>
    !search ||
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.filiere?.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.salle?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Classes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{classes.length} classes</p>
        </div>
        <button onClick={() => setModal('create')}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          ➕ Nouvelle classe
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="🔍 Nom de classe, filière..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:border-blue-500 transition"
        />
        <select value={filiereId} onChange={e => setFiliereId(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          <option value="">Toutes les filières</option>
          {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
        </select>
      </div>

      <Card>
        {isLoading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Classe</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Filière</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Année</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Élèves</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Capacité</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Salle</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {classes.map(c => {
                const pct = Math.round((c._count?.eleves / c.capaciteMax) * 100)
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-gray-900">{c.nom}</div>
                      {c.niveau && <div className="text-xs text-gray-400">{c.niveau}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={c.filiere?.nom} variant="blue" />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{c.anneeScolaire}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="text-gray-900 font-semibold">{c._count?.eleves || 0}</div>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{c.capaciteMax}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{c.salle || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button onClick={() => setModal(c)}
                          className="text-gray-400 hover:text-blue-600 transition text-xs">✏️</button>
                        <button onClick={() => setConfirm(c)}
                          className="text-gray-400 hover:text-red-500 transition text-xs">🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!classes.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="text-4xl mb-3">🏫</div>
                    <div className="font-semibold text-gray-500">
                      {search || filiereId ? 'Aucune classe trouvée' : 'Aucune classe créée'}
                    </div>
                    {!search && !filiereId && (
                      <div className="text-sm text-gray-400 mt-1">Cliquez sur "Nouvelle classe" pour commencer</div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {(modal === 'create' || (modal && modal.id)) && (
        <ClasseModal
          classe={modal === 'create' ? null : modal}
          centreId={user?.centreId}
          onClose={() => setModal(null)}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => remove(confirm.id)}
        title="Supprimer la classe"
        message={`Êtes-vous sûr de vouloir supprimer la classe "${confirm?.nom}" ? Cette action est irréversible.`}
      />
    </div>
  )
}