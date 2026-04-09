import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { absencesApi } from '../../api/absences'
import { elevesApi }   from '../../api/eleves'
import { matieresApi } from '../../api/matieres'
import { toast } from 'sonner'
import Card     from '../../components/ui/Card'
import Badge    from '../../components/ui/Badge'
import Spinner  from '../../components/ui/Spinner'
import StatCard from '../../components/ui/StatCard'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

function AbsenceModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    eleveId:     '',
    matiereId:   '',
    dateAbsence: new Date().toISOString().slice(0, 10),
    type:        'SEANCE',
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data: elevesRes } = useQuery({
    queryKey: ['eleves-all'],
    queryFn:  () => elevesApi.getAll({ limit: 200 })
  })
  const { data: matieresRes } = useQuery({
    queryKey: ['matieres-all'],
    queryFn:  () => matieresApi.getAll()
  })

  const eleves   = elevesRes?.data?.data   || []
  const matieres = matieresRes?.data?.data || []

  const { mutate, isPending } = useMutation({
    mutationFn: absencesApi.create,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['absences'] })
      qc.invalidateQueries({ queryKey: ['absences-stats'] })
      toast.success('Absence saisie')
      onClose()
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur')
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Saisir une absence</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>
          )}
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
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Matière</label>
            <select value={form.matiereId} onChange={e => set('matiereId', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="">Absence journée entière</option>
              {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date *</label>
              <input type="date" value={form.dateAbsence} onChange={e => set('dateAbsence', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type *</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option value="SEANCE">Séance</option>
                <option value="JOURNEE">Journée</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={() => { if (!form.eleveId) { setError('Élève requis'); return } mutate(form) }}
              disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {isPending ? 'Enregistrement...' : 'Saisir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function JustifyModal({ absence, onClose }) {
  const qc = useQueryClient()
  const [motif, setMotif] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () => absencesApi.justify(absence.id, { motif }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['absences'] })
      qc.invalidateQueries({ queryKey: ['absences-stats'] })
      toast.success('Absence justifiée')
      onClose()
    }
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Justifier l'absence</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
            <strong>{absence.eleve.utilisateur.prenom} {absence.eleve.utilisateur.nom}</strong>
            <div className="text-gray-400 mt-0.5">
              {new Date(absence.dateAbsence).toLocaleDateString('fr-FR')} · {absence.type}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Motif</label>
            <input type="text" value={motif} onChange={e => setMotif(e.target.value)}
              placeholder="Certificat médical, convocation..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={() => mutate()} disabled={isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {isPending ? '...' : '✅ Justifier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Absences() {
  const qc = useQueryClient()
  const [modal,     setModal]     = useState(false)
  const [justify,   setJustify]   = useState(null)
  const [confirm,   setConfirm]   = useState(null)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin,   setDateFin]   = useState('')
  const [page,      setPage]      = useState(1)

  const { data: statsRes } = useQuery({
    queryKey: ['absences-stats'],
    queryFn:  absencesApi.getStats
  })

  const { data, isLoading } = useQuery({
    queryKey: ['absences', { dateDebut, dateFin, page }],
    queryFn:  () => absencesApi.getAll({ dateDebut, dateFin, page, limit: 15 }),
    keepPreviousData: true
  })

  const { mutate: remove } = useMutation({
    mutationFn: absencesApi.remove,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['absences'] })
      qc.invalidateQueries({ queryKey: ['absences-stats'] })
      toast.success('Absence supprimée')
    }
  })

  const stats    = statsRes?.data?.data
  const absences = data?.data?.data || []
  const meta     = data?.data?.meta || {}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Absences</h1>
          <p className="text-sm text-gray-500 mt-0.5">Suivi des présences</p>
        </div>
        <button onClick={() => setModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2">
          ➕ Saisir absence
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        <StatCard icon="📅" bg="bg-red-50"   label="Aujourd'hui"    value={stats?.today       ?? '—'} />
        <StatCard icon="📆" bg="bg-amber-50"  label="Cette semaine"  value={stats?.thisWeek    ?? '—'} />
        <StatCard icon="⚠️" bg="bg-rose-50"   label="Non justifiées" value={stats?.unjustified ?? '—'} />
      </div>

      <div className="flex gap-2 lg:gap-3 flex-wrap">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Du</label>
          <input type="date" value={dateDebut}
            onChange={e => { setDateDebut(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Au</label>
          <input type="date" value={dateFin}
            onChange={e => { setDateFin(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        {(dateDebut || dateFin) && (
          <button onClick={() => { setDateDebut(''); setDateFin('') }}
            className="self-end text-xs text-gray-400 hover:text-red-500 transition mb-0.5">
            ✕ Effacer
          </button>
        )}
      </div>

      <Card>
        {isLoading ? <Spinner /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Élève</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Date</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Type</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Matière</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Justifiée</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {absences.map(a => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">
                        {a.eleve.utilisateur.prenom} {a.eleve.utilisateur.nom}
                      </div>
                      <div className="text-xs text-gray-400">{a.eleve.classe?.nom}</div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {new Date(a.dateAbsence).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={a.type} variant={a.type === 'JOURNEE' ? 'red' : 'amber'} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{a.matiere?.nom || '—'}</td>
                    <td className="px-5 py-3.5">
                      <Badge label={a.estJustifiee ? 'Oui' : 'Non'} variant={a.estJustifiee ? 'green' : 'red'} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        {!a.estJustifiee && (
                          <button onClick={() => setJustify(a)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition">
                            ✅ Justifier
                          </button>
                        )}
                        <button onClick={() => setConfirm(a)}
                          className="text-xs text-gray-400 hover:text-red-500 transition">
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!absences.length && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">Aucune absence trouvée</td>
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

      {modal   && <AbsenceModal onClose={() => setModal(false)} />}
      {justify && <JustifyModal absence={justify} onClose={() => setJustify(null)} />}

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => remove(confirm.id)}
        title="Supprimer l'absence"
        message={`Supprimer l'absence du ${confirm ? new Date(confirm.dateAbsence).toLocaleDateString('fr-FR') : ''} pour ${confirm?.eleve?.utilisateur?.prenom} ${confirm?.eleve?.utilisateur?.nom} ?`}
      />
    </div>
  )
}