import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notesApi } from '../../api/notes'
import { elevesApi } from '../../api/eleves'
import { matieresApi } from '../../api/matieres'
import { classesApi } from '../../api/classes'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import StatCard from '../../components/ui/StatCard'
import { toast } from 'sonner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const PERIODES = ['T1', 'T2', 'T3']
const TYPE_EVALS = ['CONTROLE', 'EXAMEN', 'TP', 'PROJET']

const TYPE_COLORS = {
  CONTROLE: 'blue',
  EXAMEN: 'violet',
  TP: 'teal',
  PROJET: 'amber',
}

// ── NOTE MODAL ─────────────────────────────────────
function NoteModal({ note, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!note

  const [form, setForm] = useState({
    eleveId: note?.eleveId || '',
    matiereId: note?.matiereId || '',
    periode: note?.periode || 'T1',
    typeEval: note?.typeEval || 'CONTROLE',
    note: note?.note || '',
    noteMax: note?.noteMax || 20,
    appreciation: note?.appreciation || '',
    dateEval: note?.dateEval?.slice(0, 10) || new Date().toISOString().slice(0, 10),
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data: elevesRes } = useQuery({ queryKey: ['eleves-all'], queryFn: () => elevesApi.getAll({ limit: 200 }) })
  const { data: matieresRes } = useQuery({ queryKey: ['matieres-all'], queryFn: matieresApi.getAll })

  const eleves = elevesRes?.data?.data || []
  const matieres = matieresRes?.data?.data || []

  const { mutate, isPending } = useMutation({
    mutationFn: isEdit
      ? (data) => notesApi.update(note.id, data)
      : (data) => notesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      toast.success(isEdit ? 'Note modifiée' : 'Note saisie')
      onClose()
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur')
  })

  const handleSubmit = () => {
    if (!form.eleveId || !form.matiereId || !form.note) {
      setError('Élève, matière et note sont requis')
      return
    }
    setError('')
    mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Modifier la note' : 'Saisir une note'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Élève *</label>
              <select value={form.eleveId} onChange={e => set('eleveId', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option value="">Choisir un élève</option>
                {eleves.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.utilisateur.prenom} {e.utilisateur.nom} — {e.classe?.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Matière *</label>
            <select value={form.matiereId} onChange={e => set('matiereId', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="">Choisir une matière</option>
              {matieres.map(m => (
                <option key={m.id} value={m.id}>{m.nom} (coeff. {m.coefficient})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Période *</label>
              <select value={form.periode} onChange={e => set('periode', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                {PERIODES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type éval. *</label>
              <select value={form.typeEval} onChange={e => set('typeEval', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                {TYPE_EVALS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Note *</label>
              <input type="number" min={0} max={form.noteMax} step={0.25}
                value={form.note} onChange={e => set('note', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="0 – 20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Note max</label>
              <input type="number" min={1}
                value={form.noteMax} onChange={e => set('noteMax', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date de l'évaluation *</label>
            <input type="date" value={form.dateEval} onChange={e => set('dateEval', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Appréciation</label>
            <input type="text" value={form.appreciation} onChange={e => set('appreciation', e.target.value)}
              placeholder="Très bien, Encouragements..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {isPending ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Saisir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MOYENNE PANEL ──────────────────────────────────
function MoyennePanel({ classeId, periode, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['moyenne-classe', classeId, periode],
    queryFn: () => notesApi.getMoyenneClasse(classeId, periode),
    enabled: !!classeId && !!periode
  })

  const results = data?.data?.data || []

  const moyenneColor = (m) => {
    if (m >= 16) return 'text-emerald-600'
    if (m >= 12) return 'text-blue-600'
    if (m >= 10) return 'text-amber-600'
    return 'text-red-500'
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Classement — {periode}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-4">
          {isLoading ? <Spinner /> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-2.5">Rang</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-2.5">Élève</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-2.5">Moyenne</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.eleveId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`font-bold text-lg ${r.rang <= 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                        {r.rang <= 3 ? ['🥇', '🥈', '🥉'][r.rang - 1] : `#${r.rang}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{r.prenom} {r.nom}</div>
                      <div className="text-xs text-gray-400 font-mono">{r.matricule}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xl font-bold ${moyenneColor(r.moyenne)}`}>
                        {r.moyenne?.toFixed(2)}
                      </span>
                      <span className="text-gray-400 text-xs"> /20</span>
                    </td>
                  </tr>
                ))}
                {!results.length && (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-400">Aucune note pour cette période</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────
export default function Notes() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [eleveId, setEleveId] = useState('')
  const [periode, setPeriode] = useState('')
  const [classeId, setClasseId] = useState('')
  const [showMoyenne, setShowMoyenne] = useState(false)
  const [page, setPage] = useState(1)

  const { data: classesRes } = useQuery({
    queryKey: ['classes'],
    queryFn: classesApi.getAll
  })
  const classes = classesRes?.data?.data || []

  const { data, isLoading } = useQuery({
    queryKey: ['notes', { eleveId, periode, classeId, page }],
    queryFn: () => notesApi.getAll({ eleveId, periode, classeId, page, limit: 15 }),
    keepPreviousData: true
  })

  const [confirm, setConfirm] = useState(null)

  const { mutate: remove } = useMutation({
    mutationFn: notesApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Note supprimée')
    }
  })

  const notes = data?.data?.data || []
  const meta = data?.data?.meta || {}

  const noteColor = (n, max) => {
    const pct = n / max
    if (pct >= 0.8) return 'text-emerald-600'
    if (pct >= 0.6) return 'text-blue-600'
    if (pct >= 0.5) return 'text-amber-600'
    return 'text-red-500'
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.total || 0} notes au total</p>
        </div>
        <div className="flex gap-2">
          {classeId && periode && (
            <button onClick={() => setShowMoyenne(true)}
              className="border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition">
              🏆 Classement
            </button>
          )}
          <button onClick={() => setModal('create')}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
            ➕ Saisir note
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 lg:gap-3 flex-wrap">
        <select value={classeId} onChange={e => { setClasseId(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          <option value="">Toutes les classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>

        <select value={periode} onChange={e => { setPeriode(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          <option value="">Toutes les périodes</option>
          {PERIODES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? <Spinner /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Élève</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Matière</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Période</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Type</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Note</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {notes.map(n => (
                  <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">
                        {n.eleve.utilisateur.prenom} {n.eleve.utilisateur.nom}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {n.matiere.nom}
                      <span className="text-xs text-gray-400 ml-1">×{n.matiere.coefficient}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={n.periode} variant="gray" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={n.typeEval} variant={TYPE_COLORS[n.typeEval]} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-lg font-bold ${noteColor(n.note, n.noteMax)}`}>
                        {parseFloat(n.note).toFixed(2)}
                      </span>
                      <span className="text-gray-400 text-xs">/{n.noteMax}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(n.dateEval).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button onClick={() => setModal(n)}
                          className="text-xs text-gray-400 hover:text-blue-600 transition">✏️</button>
                        <button onClick={() => setConfirm(n)}
                          className="text-xs text-gray-400 hover:text-red-500 transition">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!notes.length && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                      Aucune note trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {meta.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">Page {meta.page} sur {meta.totalPages}</span>
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

      {(modal === 'create' || (modal && modal.id)) && (
        <NoteModal note={modal === 'create' ? null : modal} onClose={() => setModal(null)} />
      )}

      {showMoyenne && (
        <MoyennePanel
          classeId={classeId}
          periode={periode}
          onClose={() => setShowMoyenne(false)}
        />
      )}
      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => remove(confirm.id)}
        title="Supprimer la note"
        message={`Supprimer la note de ${confirm?.eleve?.utilisateur?.prenom} ${confirm?.eleve?.utilisateur?.nom} en ${confirm?.matiere?.nom} (${confirm?.note}/${confirm?.noteMax}) ?`}
      />
    </div>
  )
}