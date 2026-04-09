import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { candidaturesApi } from '../../api/candidatures'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import StatCard from '../../components/ui/StatCard'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import api from '../../api/axios'
import { elevesApi } from '../../api/eleves'


const STATUT_COLORS = {
  EN_ATTENTE: 'amber',
  EN_COURS: 'blue',
  ACCEPTEE: 'green',
  REFUSEE: 'red',
}

const STATUT_LABELS = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  ACCEPTEE: 'Acceptée',
  REFUSEE: 'Refusée',
}

function CandidatureModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', telephone: '',
    centreId: '', filiereId: '', message: '',
    nomParent: '', telParent: ''
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data: centresRes } = useQuery({
    queryKey: ['public-centres'],
    queryFn: () => import('axios').then(m => m.default.get('/api/centres'))
  })
  const { data: filieresRes } = useQuery({
    queryKey: ['public-filieres', form.centreId],
    queryFn: () => import('axios').then(m => m.default.get('/api/filieres', { params: { centreId: form.centreId } })),
    enabled: !!form.centreId
  })

  const centres = centresRes?.data?.data || []
  const filieres = filieresRes?.data?.data || []

  const { mutate, isPending } = useMutation({
    mutationFn: candidaturesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidatures'] })
      qc.invalidateQueries({ queryKey: ['candidatures-stats'] })
      toast.success('Candidature créée')
      onClose()
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur')
  })

  const handleSubmit = () => {
    if (!form.prenom || !form.nom || !form.email || !form.centreId) {
      setError('Prénom, nom, email et centre sont requis')
      return
    }
    setError('')
    mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Nouvelle candidature</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *" value={form.prenom} onChange={v => set('prenom', v)} />
            <Field label="Nom *" value={form.nom} onChange={v => set('nom', v)} />
          </div>
          <Field label="Email *" value={form.email} onChange={v => set('email', v)} type="email" />
          <Field label="Téléphone" value={form.telephone} onChange={v => set('telephone', v)} />
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Centre *</label>
            <select value={form.centreId} onChange={e => { set('centreId', e.target.value); set('filiereId', '') }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="">Choisir un centre</option>
              {centres.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Filière souhaitée</label>
            <select value={form.filiereId} onChange={e => set('filiereId', e.target.value)}
              disabled={!form.centreId}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50">
              <option value="">{form.centreId ? 'Choisir une filière' : 'Sélectionnez un centre d\'abord'}</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom du parent" value={form.nomParent} onChange={v => set('nomParent', v)} />
            <Field label="Tél. parent" value={form.telParent} onChange={v => set('telParent', v)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message / Notes</label>
            <textarea value={form.message} onChange={e => set('message', e.target.value)}
              rows={3} placeholder="Notes supplémentaires..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {isPending ? 'Enregistrement...' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition" />
    </div>
  )
}

function ConvertirEleveModal({ candidature, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    prenom: candidature.prenom,
    nom: candidature.nom,
    email: candidature.email,
    telephone: candidature.telephone || '',
    dateNaissance: '',
    classeId: '',
    cin: '',
    nomParent: candidature.nomParent || '',
    telParent: candidature.telParent || '',
    centreId: candidature.centreId,
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data: classesRes } = useQuery({
    queryKey: ['classes-by-filiere', candidature.filiereId],
    queryFn: () => api.get('/classes', { params: { filiereId: candidature.filiereId } }),
    enabled: !!candidature.filiereId
  })
  const classes = classesRes?.data?.data || []

  const { mutate, isPending } = useMutation({
    mutationFn: elevesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eleves'] })
      toast.success('Élève créé avec succès !')
      onClose()
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur')
  })

  const handleSubmit = () => {
    if (!form.prenom || !form.nom || !form.email || !form.classeId || !form.dateNaissance) {
      setError('Prénom, nom, email, classe et date de naissance sont requis')
      return
    }
    setError('')
    mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Créer le dossier élève</h2>
            <p className="text-xs text-gray-400 mt-0.5">Candidature de {candidature.prenom} {candidature.nom}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>
          )}

          {/* Pre-filled info notice */}
          <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg px-4 py-2">
            ℹ️ Les informations sont pré-remplies depuis la candidature. Vérifiez et complétez avant de créer.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *" value={form.prenom} onChange={v => set('prenom', v)} />
            <Field label="Nom *" value={form.nom} onChange={v => set('nom', v)} />
          </div>
          <Field label="Email *" value={form.email} onChange={v => set('email', v)} type="email" />
          <Field label="Téléphone" value={form.telephone} onChange={v => set('telephone', v)} />
          <Field label="Date de naissance *" value={form.dateNaissance} onChange={v => set('dateNaissance', v)} type="date" />
          <Field label="CIN" value={form.cin} onChange={v => set('cin', v)} />

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Classe *
              {candidature.filiere && (
                <span className="text-blue-500 font-normal ml-1">— Filière: {candidature.filiere.nom}</span>
              )}
            </label>
            <select value={form.classeId} onChange={e => set('classeId', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="">Choisir une classe</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.nom} — {c.anneeScolaire}</option>
              ))}
            </select>
            {classes.length === 0 && candidature.filiereId && (
              <p className="text-xs text-amber-600 mt-1">⚠️ Aucune classe disponible pour cette filière</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom du parent" value={form.nomParent} onChange={v => set('nomParent', v)} />
            <Field label="Tél. parent" value={form.telParent} onChange={v => set('telParent', v)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {isPending ? 'Création...' : '🎓 Créer l\'élève'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── DETAIL PANEL ───────────────────────────────────
function CandidaturePanel({ candidature, onClose }) {
  const qc = useQueryClient()
  const [noteInterne, setNoteInterne] = useState(candidature.noteInterne || '')
  const [confirm, setConfirm] = useState(null)
  const [convertir, setConvertir] = useState(false)

  const { mutate: updateStatut, isPending } = useMutation({
    mutationFn: ({ statut }) => candidaturesApi.updateStatut(candidature.id, { statut, noteInterne }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['candidatures'] })
      qc.invalidateQueries({ queryKey: ['candidatures-stats'] })
      toast.success('Statut mis à jour')
      if (variables.statut === 'ACCEPTEE') {
        setConvertir(true)
      } else {
        onClose()
      }
    }
  })

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-2xl z-40 flex flex-col">
      <div className="bg-gradient-to-br from-gray-950 to-blue-950 p-6 relative">
        <button onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white text-lg">✕</button>
        <div className="text-white font-bold text-xl mb-1">
          {candidature.prenom} {candidature.nom}
        </div>
        <div className="text-gray-400 text-sm">{candidature.email}</div>
        <div className="mt-3">
          <Badge label={STATUT_LABELS[candidature.statut]} variant={STATUT_COLORS[candidature.statut]} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Infos */}
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Informations</div>
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            {[
              ['Filière souhaitée', candidature.filiere?.nom || '—'],
              ['Téléphone', candidature.telephone || '—'],
              ['Date de naissance', candidature.dateNaissance
                ? new Date(candidature.dateNaissance).toLocaleDateString('fr-FR')
                : '—'],
              ['Adresse', candidature.adresse || '—'],
              ['Nom parent', candidature.nomParent || '—'],
              ['Tél. parent', candidature.telParent || '—'],
              ['Reçue le', new Date(candidature.createdAt).toLocaleDateString('fr-FR')],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-start text-sm gap-2">
                <span className="text-gray-500 flex-shrink-0">{label}</span>
                <span className="font-semibold text-gray-800 text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Message */}
        {candidature.message && (
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Message</div>
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 leading-relaxed">
              {candidature.message}
            </div>
          </div>
        )}

        {/* Note interne */}
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Note interne</div>
          <textarea
            value={noteInterne}
            onChange={e => setNoteInterne(e.target.value)}
            placeholder="Ajouter une note interne..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Traité par */}
        {candidature.traiteParUser && (
          <div className="text-xs text-gray-400 text-center">
            Traité par {candidature.traiteParUser.prenom} {candidature.traiteParUser.nom}
            {candidature.traiteAt && ` · ${new Date(candidature.traiteAt).toLocaleDateString('fr-FR')}`}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setConfirm('ACCEPTEE')}
            disabled={candidature.statut === 'ACCEPTEE' || isPending}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg py-2 transition">
            ✅ Accepter
          </button>
          <button
            onClick={() => setConfirm('REFUSEE')}
            disabled={candidature.statut === 'REFUSEE' || isPending}
            className="bg-red-500 hover:bg-red-400 disabled:opacity-40 text-white text-sm font-semibold rounded-lg py-2 transition">
            ❌ Refuser
          </button>
        </div>
        <button
          onClick={() => setConfirm('EN_COURS')}
          disabled={candidature.statut === 'EN_COURS' || isPending}
          className="w-full border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40 text-sm font-semibold rounded-lg py-2 transition">
          🔄 Mettre en cours
        </button>
      </div>

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => updateStatut({ statut: confirm })}
        danger={confirm === 'REFUSEE'}
        title={`${confirm === 'ACCEPTEE' ? 'Accepter' : confirm === 'REFUSEE' ? 'Refuser' : 'Mettre en cours'} la candidature`}
        message={`Confirmer le changement de statut pour ${candidature.prenom} ${candidature.nom} ?`}
        confirmLabel="Confirmer"
      />

      {convertir && (
        <ConvertirEleveModal
          candidature={candidature}
          onClose={() => { setConvertir(false); onClose() }}
        />
      )}
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────
export default function Candidatures() {
  const [statut, setStatut] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(false)

  const { data: statsRes } = useQuery({
    queryKey: ['candidatures-stats'],
    queryFn: candidaturesApi.getStats
  })

  const { data, isLoading } = useQuery({
    queryKey: ['candidatures', { statut, page }],
    queryFn: () => candidaturesApi.getAll({ statut, page, limit: 15 }),
    keepPreviousData: true
  })

  const stats = statsRes?.data?.data
  const candidatures = data?.data?.data || []
  const meta = data?.data?.meta || {}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Candidatures</h1>
          <p className="text-sm text-gray-500 mt-0.5">Inscriptions en ligne</p>
        </div>
        <button onClick={() => setModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          ➕ Nouvelle candidature
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📋" bg="bg-gray-50" label="Total" value={stats?.total ?? '—'} />
        <StatCard icon="⏳" bg="bg-amber-50" label="En attente" value={stats?.enAttente ?? '—'} />
        <StatCard icon="✅" bg="bg-emerald-50" label="Acceptées" value={stats?.acceptees ?? '—'} />
        <StatCard icon="❌" bg="bg-red-50" label="Refusées" value={stats?.refusees ?? '—'} />
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'Toutes' },
          { value: 'EN_ATTENTE', label: '⏳ En attente' },
          { value: 'EN_COURS', label: '🔄 En cours' },
          { value: 'ACCEPTEE', label: '✅ Acceptées' },
          { value: 'REFUSEE', label: '❌ Refusées' },
        ].map(f => (
          <button key={f.value}
            onClick={() => { setStatut(f.value); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${statut === f.value
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}>
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? <Spinner /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Candidat</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Filière</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Date</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Statut</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {candidatures.map(c => (
                  <tr key={c.id}
                    onClick={() => setSelected(c)}
                    className="border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{c.prenom} {c.nom}</div>
                      <div className="text-xs text-gray-400">{c.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-sm">
                      {c.filiere?.nom || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={STATUT_LABELS[c.statut]} variant={STATUT_COLORS[c.statut]} />
                    </td>
                    <td className="px-5 py-3.5">
                      <button className="text-gray-400 hover:text-blue-600 text-xs font-semibold transition">
                        Voir →
                      </button>
                    </td>
                  </tr>
                ))}
                {!candidatures.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="text-4xl mb-3">📋</div>
                      <div className="font-semibold text-gray-500">
                        {statut ? 'Aucune candidature dans ce statut' : 'Aucune candidature reçue'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {meta.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Page {meta.page} sur {meta.totalPages} · {meta.total} candidatures
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

      {selected && (
        <CandidaturePanel
          candidature={selected}
          onClose={() => setSelected(null)}
        />
      )}
      {modal && <CandidatureModal onClose={() => setModal(false)} />}
    </div>
  )
}