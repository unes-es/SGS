import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { filieresApi } from '../../api/filieres'
import { toast } from 'sonner'
import api from '../../api/axios'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const matieresApi = {
  getByFiliere: (id) => api.get(`/filieres/${id}/matieres`),
  create: (data) => api.post('/matieres', data),
  update: (id, data) => api.put(`/matieres/${id}`, data),
  remove: (id) => api.delete(`/matieres/${id}`),
}

function FiliereModal({ filiere, onClose, centreId }) {
  const qc = useQueryClient()
  const isEdit = !!filiere
  const [form, setForm] = useState({
    nom: filiere?.nom || '',
    code: filiere?.code || '',
    description: filiere?.description || '',
    dureeMois: filiere?.dureeMois || 24,
    fraisInscription: filiere?.fraisInscription || 800,
    fraisScolarite: filiere?.fraisScolarite || '',
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: isEdit
      ? (data) => filieresApi.update(filiere.id, data)
      : (data) => filieresApi.create({ ...data, centreId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['filieres'] })
      toast.success(isEdit ? 'Filière modifiée' : 'Filière créée')
      onClose()
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur')
  })

  const handleSubmit = () => {
    if (!form.nom || !form.code || !form.fraisScolarite) {
      setError('Nom, code et frais de scolarité sont requis')
      return
    }
    setError('')
    mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Modifier filière' : 'Nouvelle filière'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom *" value={form.nom} onChange={v => set('nom', v)} />
            <Field label="Code *" value={form.code} onChange={v => set('code', v)} placeholder="BTS-INFO" />
          </div>
          <Field label="Description" value={form.description} onChange={v => set('description', v)} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Durée (mois)" type="number" value={form.dureeMois} onChange={v => set('dureeMois', v)} />
            <Field label="Frais inscr. MAD" type="number" value={form.fraisInscription} onChange={v => set('fraisInscription', v)} />
            <Field label="Scolarité/mois *" type="number" value={form.fraisScolarite} onChange={v => set('fraisScolarite', v)} />
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

function MatiereForm({ filiereId, matiere, onDone }) {
  const qc = useQueryClient()
  const isEdit = !!matiere
  const [form, setForm] = useState({
    nom: matiere?.nom || '',
    code: matiere?.code || '',
    coefficient: matiere?.coefficient || 1,
    volumeHoraire: matiere?.volumeHoraire || '',
    estOptionnelle: matiere?.estOptionnelle || false,
    filiereId,
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: isEdit
      ? (data) => matieresApi.update(matiere.id, data)
      : (data) => matieresApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matieres', filiereId] })
      toast.success(isEdit ? 'Matière modifiée' : 'Matière ajoutée')
      onDone()
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur')
  })

  const handleSubmit = () => {
    if (!form.nom) { setError('Nom requis'); return }
    setError('')
    mutate(form)
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <div className="text-sm font-bold text-blue-800">
        {isEdit ? '✏️ Modifier la matière' : '➕ Nouvelle matière'}
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-1.5">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <MiniField label="Nom *" value={form.nom} onChange={v => set('nom', v)} />
        <MiniField label="Code" value={form.code} onChange={v => set('code', v)} placeholder="MATH" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MiniField label="Coefficient" type="number" value={form.coefficient} onChange={v => set('coefficient', v)} />
        <MiniField label="Vol. horaire" type="number" value={form.volumeHoraire} onChange={v => set('volumeHoraire', v)} placeholder="h" />
      </div>
      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
        <input type="checkbox" checked={form.estOptionnelle}
          onChange={e => set('estOptionnelle', e.target.checked)}
          className="rounded" />
        Matière optionnelle
      </label>
      <div className="flex gap-2">
        <button onClick={onDone}
          className="flex-1 border border-gray-200 bg-white text-gray-600 rounded-lg py-1.5 text-xs font-semibold hover:bg-gray-50 transition">
          Annuler
        </button>
        <button onClick={handleSubmit} disabled={isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-1.5 text-xs font-semibold transition">
          {isPending ? '...' : isEdit ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </div>
  )
}

function MiniField({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 bg-white transition"
      />
    </div>
  )
}

function FilierePanel({ filiere, onClose, onEdit }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editMatiere, setEditMatiere] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['matieres', filiere.id],
    queryFn: () => matieresApi.getByFiliere(filiere.id)
  })

  const { mutate: remove } = useMutation({
    mutationFn: matieresApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matieres', filiere.id] })
      toast.success('Matière supprimée')
    }
  })

  const matieres = data?.data?.data || []
  const totalCoeff = matieres.reduce((s, m) => s + parseFloat(m.coefficient), 0)

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-2xl z-40 flex flex-col">
      <div className="bg-gradient-to-br from-gray-950 to-blue-950 p-6 relative">
        <button onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white text-lg">✕</button>
        <div className="text-white font-bold text-xl mb-1">{filiere.nom}</div>
        <div className="text-gray-400 text-sm font-mono">{filiere.code}</div>
        <div className="flex gap-3 mt-4">
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <div className="text-white font-bold">{filiere.dureeMois}m</div>
            <div className="text-gray-400 text-xs">Durée</div>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <div className="text-white font-bold">{filiere._count?.classes || 0}</div>
            <div className="text-gray-400 text-xs">Classes</div>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <div className="text-white font-bold">{matieres.length}</div>
            <div className="text-gray-400 text-xs">Matières</div>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <div className="text-white font-bold">{parseFloat(filiere.fraisScolarite).toLocaleString('fr-FR')}</div>
            <div className="text-gray-400 text-xs">MAD/mois</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Matières · Σ coeff {totalCoeff}
          </div>
          <button onClick={() => { setShowForm(true); setEditMatiere(null) }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition">
            ➕ Ajouter
          </button>
        </div>

        {showForm && !editMatiere && (
          <MatiereForm filiereId={filiere.id} onDone={() => setShowForm(false)} />
        )}

        {isLoading ? <Spinner /> : (
          <div className="space-y-2">
            {matieres.map(m => (
              <div key={m.id}>
                {editMatiere?.id === m.id ? (
                  <MatiereForm
                    filiereId={filiere.id}
                    matiere={m}
                    onDone={() => setEditMatiere(null)}
                  />
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-start justify-between group hover:border-blue-200 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{m.nom}</span>
                        {m.code && <span className="font-mono text-xs text-gray-400">{m.code}</span>}
                        {m.estOptionnelle && <Badge label="Opt." variant="gray" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span>Coeff. <strong className="text-gray-800">{parseFloat(m.coefficient)}</strong></span>
                        {m.volumeHoraire && (
                          <span>Vol. <strong className="text-gray-800">{m.volumeHoraire}h</strong></span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => { setEditMatiere(m); setShowForm(false) }}
                        className="text-gray-400 hover:text-blue-600 transition text-sm">✏️</button>
                      <button onClick={() => setConfirm(m)}
                        className="text-gray-400 hover:text-red-500 transition text-sm">🗑</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!matieres.length && !showForm && (
              <div className="text-center text-gray-400 text-sm py-8">
                <div className="text-3xl mb-2">📚</div>
                Aucune matière — cliquez sur Ajouter
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 flex gap-2">
        <button onClick={() => onEdit(filiere)}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg py-2 transition">
          ✏️ Modifier filière
        </button>
      </div>

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => remove(confirm.id)}
        title="Supprimer la matière"
        message={`Supprimer la matière "${confirm?.nom}" ? Cette action est irréversible.`}
      />
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

export default function Filieres() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['filieres'],
    queryFn: filieresApi.getAll
  })

  const { mutate: remove } = useMutation({
    mutationFn: filieresApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['filieres'] })
      toast.success('Filière supprimée')
    }
  })

  const filieres = (data?.data?.data || []).filter(f =>
    !search ||
    f.nom.toLowerCase().includes(search.toLowerCase()) ||
    f.code.toLowerCase().includes(search.toLowerCase()) ||
    f.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Filières</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filieres.length} filières actives</p>
        </div>
        <button onClick={() => setModal('create')}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          ➕ Nouvelle filière
        </button>
      </div>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="🔍 Nom, code, description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:border-blue-500 transition"
        />
      </div>
      {isLoading ? <Spinner /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filieres.map(f => (
            <div key={f.id}
              onClick={() => setSelected(f)}
              className="bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-gray-900 group-hover:text-blue-600 transition">{f.nom}</div>
                  <div className="font-mono text-xs text-gray-400 mt-0.5">{f.code}</div>
                </div>
                <Badge label={`${f.dureeMois} mois`} variant="blue" />
              </div>
              {f.description && (
                <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">{f.description}</p>
              )}
              <div className="grid grid-cols-3 gap-1 lg:gap-2 mb-4">
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <div className="text-sm font-bold text-gray-900">{parseFloat(f.fraisScolarite).toLocaleString('fr-FR')}</div>
                  <div className="text-xs text-gray-400">MAD/mois</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <div className="text-sm font-bold text-gray-900">{f._count?.classes || 0}</div>
                  <div className="text-xs text-gray-400">classes</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <div className="text-sm font-bold text-gray-900">{f._count?.matieres || 0}</div>
                  <div className="text-xs text-gray-400">matières</div>
                </div>
              </div>
              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelected(f)}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-2 rounded-lg transition">
                  📚 Matières
                </button>
                <button onClick={() => setModal(f)}
                  className="border border-gray-200 text-gray-500 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-gray-50 transition">
                  ✏️
                </button>
                <button onClick={() => setConfirm(f)}
                  className="border border-gray-200 text-gray-400 text-xs px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition">
                  🗑
                </button>
              </div>
            </div>
          ))}
          {!filieres.length && (
            <div className="col-span-3 text-center text-gray-400 py-16">
              <div className="text-4xl mb-3">📚</div>
              <div className="font-semibold text-gray-500">
                {search ? 'Aucune filière trouvée' : 'Aucune filière créée'}
              </div>
              {!search && (
                <div className="text-sm text-gray-400 mt-1">Cliquez sur "Nouvelle filière" pour commencer</div>
              )}
            </div>
          )}
        </div>
      )}

      {(modal === 'create' || (modal && modal.id)) && (
        <FiliereModal
          filiere={modal === 'create' ? null : modal}
          centreId={user?.centreId}
          onClose={() => setModal(null)}
        />
      )}

      {selected && (
        <FilierePanel
          filiere={selected}
          onClose={() => setSelected(null)}
          onEdit={(f) => { setSelected(null); setModal(f) }}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => remove(confirm.id)}
        title="Désactiver la filière"
        message={`Désactiver la filière "${confirm?.nom}" ? Elle ne sera plus visible.`}
      />
    </div>
  )
}