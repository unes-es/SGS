import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '../../api/documents'
import { elevesApi }    from '../../api/eleves'
import Card     from '../../components/ui/Card'
import Badge    from '../../components/ui/Badge'
import Spinner  from '../../components/ui/Spinner'

const TYPES_DOCS = [
  'ATTESTATION_SCOLARITE',
  'RELEVE_NOTES',
  'RECU_PAIEMENT',
  'ATTESTATION_TRAVAIL',
  'BULLETIN',
  'FICHE_PAIE',
  'AUTRE'
]

const TYPE_LABELS = {
  ATTESTATION_SCOLARITE: 'Attestation scolarité',
  RELEVE_NOTES:          'Relevé de notes',
  RECU_PAIEMENT:         'Reçu de paiement',
  ATTESTATION_TRAVAIL:   'Attestation travail',
  BULLETIN:              'Bulletin',
  FICHE_PAIE:            'Fiche de paie',
  AUTRE:                 'Autre',
}

const TYPE_COLORS = {
  ATTESTATION_SCOLARITE: 'blue',
  RELEVE_NOTES:          'violet',
  RECU_PAIEMENT:         'green',
  ATTESTATION_TRAVAIL:   'teal',
  BULLETIN:              'amber',
  FICHE_PAIE:            'gray',
  AUTRE:                 'gray',
}

const TYPE_ICONS = {
  ATTESTATION_SCOLARITE: '📜',
  RELEVE_NOTES:          '📊',
  RECU_PAIEMENT:         '🧾',
  ATTESTATION_TRAVAIL:   '💼',
  BULLETIN:              '📋',
  FICHE_PAIE:            '💰',
  AUTRE:                 '📄',
}

// ── CREATE MODAL ───────────────────────────────────
function DocumentModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    eleveId:      '',
    type:         'ATTESTATION_SCOLARITE',
    titre:        '',
    anneeScolaire:'2025-2026',
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data: elevesRes } = useQuery({
    queryKey: ['eleves-all'],
    queryFn:  () => elevesApi.getAll({ limit: 200 })
  })
  const eleves = elevesRes?.data?.data || []

  // auto-fill titre when type changes
  const handleTypeChange = (type) => {
    set('type', type)
    set('titre', TYPE_LABELS[type] + ' ' + form.anneeScolaire)
  }

  const { mutate, isPending } = useMutation({
    mutationFn: documentsApi.create,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      onClose()
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur')
  })

  const handleSubmit = () => {
    if (!form.eleveId || !form.titre) {
      setError('Élève et titre sont requis')
      return
    }
    setError('')
    mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">📄 Générer un document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Élève *</label>
            <select value={form.eleveId} onChange={e => set('eleveId', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="">Choisir un élève</option>
              {eleves.map(e => (
                <option key={e.id} value={e.id}>
                  {e.utilisateur.prenom} {e.utilisateur.nom} — {e.matricule}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Type de document *</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES_DOCS.map(t => (
                <button key={t} type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-xs font-semibold transition ${
                    form.type === t
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <span>{TYPE_ICONS[t]}</span>
                  <span className="truncate">{TYPE_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Titre *</label>
            <input type="text" value={form.titre} onChange={e => set('titre', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Titre du document"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Année scolaire</label>
            <input type="text" value={form.anneeScolaire} onChange={e => set('anneeScolaire', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="2025-2026"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {isPending ? 'Génération...' : '📥 Générer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────
export default function Documents() {
  const qc = useQueryClient()
  const [modal,  setModal]  = useState(false)
  const [type,   setType]   = useState('')
  const [page,   setPage]   = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { type, page }],
    queryFn:  () => documentsApi.getAll({ type, page, limit: 15 }),
    keepPreviousData: true
  })

  const { mutate: remove } = useMutation({
    mutationFn: documentsApi.remove,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['documents'] })
  })

  const documents = data?.data?.data || []
  const meta      = data?.data?.meta || {}

  // counts per type
  const counts = TYPES_DOCS.reduce((acc, t) => {
    acc[t] = documents.filter(d => d.type === t).length
    return acc
  }, {})

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.total || 0} documents archivés</p>
        </div>
        <button onClick={() => setModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          📄 Générer document
        </button>
      </div>

      {/* Type cards */}
      <div className="grid grid-cols-3 lg:grid-cols-7 gap-3">
        {TYPES_DOCS.map(t => (
          <button key={t}
            onClick={() => setType(type === t ? '' : t)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition ${
              type === t
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}>
            <span className="text-2xl">{TYPE_ICONS[t]}</span>
            <span className="text-xs font-semibold text-gray-600 leading-tight">{TYPE_LABELS[t]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        {isLoading ? <Spinner /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Document</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Élève</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Type</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">N° Série</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Généré le</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Par</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {documents.map(d => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{TYPE_ICONS[d.type]}</span>
                        <span className="font-semibold text-gray-900 text-sm">{d.titre}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">
                        {d.eleve.utilisateur.prenom} {d.eleve.utilisateur.nom}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={TYPE_LABELS[d.type]} variant={TYPE_COLORS[d.type]} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">
                      {d.numeroSerie}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {d.genereParUser?.prenom} {d.genereParUser?.nom}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button className="text-xs text-blue-500 hover:text-blue-700 font-semibold transition">
                          ⬇️ PDF
                        </button>
                        <button
                          onClick={() => { if (confirm('Supprimer ce document ?')) remove(d.id) }}
                          className="text-xs text-gray-400 hover:text-red-500 transition">
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!documents.length && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                      Aucun document trouvé
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

      {modal && <DocumentModal onClose={() => setModal(false)} />}
    </div>
  )
}