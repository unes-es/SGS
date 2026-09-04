import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { emploisApi } from '../../api/emplois'
import { classesApi } from '../../api/classes'
import { matieresApi } from '../../api/matieres'
import { personnelApi } from '../../api/personnel'
import { useCentreStore } from '../../store/centreStore'
import { toast } from 'sonner'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Badge from '../../components/ui/Badge'
import SearchSelect from '../../components/ui/SearchSelect'

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
const JOURS_LABELS = { LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi', JEUDI: 'Jeudi', VENDREDI: 'Vendredi', SAMEDI: 'Samedi' }
const TYPE_FORMATION_LABELS = { JOUR: 'Jour', SOIR: 'Soir', WEEKEND: 'Weekend', HYBRIDE: 'Hybride', INTENSIF: 'Intensif' }
const TYPE_FORMATION_COLORS = { JOUR: 'blue', SOIR: 'violet', WEEKEND: 'amber', HYBRIDE: 'green', INTENSIF: 'red' }

const COLORS = [
  'bg-blue-100 border-blue-200 text-blue-800',
  'bg-violet-100 border-violet-200 text-violet-800',
  'bg-emerald-100 border-emerald-200 text-emerald-800',
  'bg-amber-100 border-amber-200 text-amber-800',
  'bg-rose-100 border-rose-200 text-rose-800',
  'bg-teal-100 border-teal-200 text-teal-800',
]

// Phase 2.3 - a créneau's sensible default start/end time depends on what
// format the classe actually runs in; a JOUR class defaulting to 8h-10h
// makes sense, a SOIR one wouldn't. Just the initial form value - still
// freely editable per créneau afterward.
const DEFAULT_HORAIRES = {
  JOUR: ['08:00', '10:00'],
  SOIR: ['18:00', '20:00'],
  WEEKEND: ['08:00', '10:00'],
  HYBRIDE: ['08:00', '10:00'],
  INTENSIF: ['08:00', '12:00'],
}

function EmploiModal({ onClose, classeId, typeFormation }) {
  const qc = useQueryClient()
  const { selectedCentreId } = useCentreStore()
  const [heureDebutDefault, heureFinDefault] = DEFAULT_HORAIRES[typeFormation] || DEFAULT_HORAIRES.JOUR
  const [form, setForm] = useState({
    classeId,
    matiereId: '',
    professeurId: '',
    jourSemaine: 'LUNDI',
    heureDebut: heureDebutDefault,
    heureFin: heureFinDefault,
    salle: '',
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data: matieresRes } = useQuery({ queryKey: ['matieres-all'], queryFn: () => matieresApi.getAll() })
  // Was `queryFn: personnelApi.getAll` (a bare reference) - react-query
  // calls the queryFn with its own context object ({queryKey, signal,
  // ...}), which personnelApi.getAll would then forward straight through
  // as axios `params`, leaking react-query internals into the query
  // string. Also had no centreId at all, same cross-centre leak as the
  // élève selectors elsewhere on this pass.
  const { data: personnelRes } = useQuery({
    queryKey: ['personnel-all', selectedCentreId],
    queryFn: () => personnelApi.getAll({ limit: 500, centreId: selectedCentreId || undefined })
  })

  const matieres = matieresRes?.data?.data || []
  const personnel = personnelRes?.data?.data || []

  const { mutate, isPending } = useMutation({
    mutationFn: emploisApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emplois'] })
      toast.success('Séance ajoutée')
      onClose()
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur')
  })

  const handleSubmit = () => {
    if (!form.matiereId || !form.professeurId) {
      setError('Matière et professeur sont requis')
      return
    }
    setError('')
    mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Ajouter une séance</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jour *</label>
            <select value={form.jourSemaine} onChange={e => set('jourSemaine', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              {JOURS.map(j => <option key={j} value={j}>{JOURS_LABELS[j]}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Heure début</label>
              <input type="time" value={form.heureDebut} onChange={e => set('heureDebut', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Heure fin</label>
              <input type="time" value={form.heureFin} onChange={e => set('heureFin', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Matière *</label>
            <select value={form.matiereId} onChange={e => set('matiereId', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="">Choisir</option>
              {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Professeur *</label>
            <SearchSelect
              value={form.professeurId}
              onChange={v => set('professeurId', v)}
              placeholder="Rechercher un professeur..."
              options={personnel.map(p => ({
                value: p.id,
                label: `${p.utilisateur.prenom} ${p.utilisateur.nom}`,
                sublabel: p.poste
              }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Salle</label>
            <input type="text" value={form.salle} onChange={e => set('salle', e.target.value)}
              placeholder="Salle A1, Labo..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {isPending ? 'Enregistrement...' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Emplois() {
  const qc = useQueryClient()
  const { selectedCentreId } = useCentreStore()
  const [classeId, setClasseId] = useState('')
  const [modal, setModal] = useState(false)
  const [confirm, setConfirm] = useState(null)

  // Same bare-reference issue as personnelApi.getAll above, plus no
  // centreId - a SUPER_ADMIN viewing another centre via the switcher was
  // still picking a créneau's classe from their own centre's list.
  const { data: classesRes } = useQuery({
    queryKey: ['classes', selectedCentreId],
    queryFn: () => classesApi.getAll({ centreId: selectedCentreId || undefined })
  })

  const { data, isLoading } = useQuery({
    queryKey: ['emplois', { classeId }],
    queryFn: () => emploisApi.getAll({ classeId }),
    enabled: !!classeId
  })

  const { mutate: remove } = useMutation({
    mutationFn: emploisApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emplois'] })
      toast.success('Séance supprimée')
    }
  })

  const classes = classesRes?.data?.data || []
  const emplois = data?.data?.data || []

  const byJour = JOURS.reduce((acc, j) => {
    acc[j] = emplois.filter(e => e.jourSemaine === j)
    return acc
  }, {})

  const matiereColors = {}
  emplois.forEach((e) => {
    if (!matiereColors[e.matiereId]) {
      matiereColors[e.matiereId] = COLORS[Object.keys(matiereColors).length % COLORS.length]
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Emplois du temps</h1>
          <p className="text-sm text-gray-500 mt-0.5">Planning hebdomadaire par classe</p>
        </div>
        <div className="flex gap-2">
          {classeId && !isLoading && emplois.length > 0 && (
            <button
              onClick={() => window.print()}
              className="no-print border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition">
              🖨️ Imprimer
            </button>
          )}
          <button onClick={() => setModal(true)} disabled={!classeId}
            className="no-print bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
            ➕ Ajouter séance
          </button>
        </div>
      </div>

      <div className="no-print flex items-center gap-3">
        <select value={classeId} onChange={e => setClasseId(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-64">
          <option value="">Sélectionner une classe</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.nom} — {c.filiere?.nom}</option>)}
        </select>
        {classeId && classes.find(c => c.id === classeId)?.typeFormation && (
          <Badge
            label={TYPE_FORMATION_LABELS[classes.find(c => c.id === classeId).typeFormation]}
            variant={TYPE_FORMATION_COLORS[classes.find(c => c.id === classeId).typeFormation] || 'gray'}
          />
        )}
      </div>

      {!classeId && (
        <div className="no-print bg-gray-50 border border-gray-200 rounded-2xl p-16 text-center text-gray-400">
          <div className="text-4xl mb-3">🗓️</div>
          <div className="font-semibold">Sélectionnez une classe pour voir son emploi du temps</div>
        </div>
      )}

      {classeId && isLoading && <Spinner />}

      {classeId && !isLoading && (
        <div className="print-area">
          {/* Print header — only shows when printing */}
          <div className="hidden print:block mb-6">
            <h2 className="text-xl font-bold text-gray-900">Emploi du temps</h2>
            <p className="text-sm text-gray-600">
              {classes.find(c => c.id === classeId)?.nom} — {classes.find(c => c.id === classeId)?.filiere?.nom}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Année scolaire 2025-2026 · Imprimé le {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-6 divide-x divide-gray-100">
              {JOURS.map(jour => (
                <div key={jour}>
                  <div className="bg-gray-50 border-b border-gray-100 px-3 py-3 text-center">
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">{JOURS_LABELS[jour]}</div>
                    <div className="text-xs text-gray-400 mt-0.5 no-print">{byJour[jour].length} séance{byJour[jour].length !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="p-2 min-h-48 space-y-2">
                    {byJour[jour]
                      .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut))
                      .map(e => (
                        <div key={e.id}
                          className={`border rounded-xl p-2.5 text-xs group relative ${matiereColors[e.matiereId]}`}>
                          <div className="font-bold leading-snug">{e.matiere?.nom}</div>
                          <div className="mt-1 opacity-75">{e.heureDebut} – {e.heureFin}</div>
                          <div className="opacity-75 truncate">
                            {e.professeur?.utilisateur?.prenom} {e.professeur?.utilisateur?.nom}
                          </div>
                          {e.salle && <div className="opacity-60">📍 {e.salle}</div>}
                          <button
                            onClick={() => setConfirm(e)}
                            className="no-print absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700 text-sm">
                            ✕
                          </button>
                        </div>
                      ))
                    }
                    {byJour[jour].length === 0 && (
                      <div className="text-center text-gray-300 text-xs py-4">—</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {modal && classeId && (
        <EmploiModal
          classeId={classeId}
          typeFormation={classes.find(c => c.id === classeId)?.typeFormation}
          onClose={() => setModal(false)}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => remove(confirm.id)}
        title="Supprimer la séance"
        message={`Supprimer la séance de "${confirm?.matiere?.nom}" (${confirm?.jourSemaine} ${confirm?.heureDebut}–${confirm?.heureFin}) ?`}
      />
    </div>
  )
}