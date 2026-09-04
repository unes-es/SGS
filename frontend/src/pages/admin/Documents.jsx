import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '../../api/documents'
import { caisseApi } from '../../api/caisse'
import api from '../../api/axios'
import { elevesApi } from '../../api/eleves'
import { personnelApi } from '../../api/personnel'
import { useCentreStore } from '../../store/centreStore'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SearchSelect from '../../components/ui/SearchSelect'

const TYPES_DOCS = [
  'ATTESTATION_SCOLARITE',
  'RELEVE_NOTES',
  'RECU_PAIEMENT',
  'ATTESTATION_TRAVAIL',
  'BULLETIN',
  'FICHE_PAIE',
  'AUTRE'
]

// These two document types are about a staff member, not a student -
// the creation form shows a Personnel selector instead of an Élève one,
// and the backend stores personnelId instead of eleveId for them.
const PERSONNEL_TYPES = ['ATTESTATION_TRAVAIL', 'FICHE_PAIE']

const TYPE_LABELS = {
  ATTESTATION_SCOLARITE: 'Attestation scolarité',
  RELEVE_NOTES: 'Relevé de notes',
  RECU_PAIEMENT: 'Reçu de paiement',
  ATTESTATION_TRAVAIL: 'Attestation travail',
  BULLETIN: 'Bulletin',
  FICHE_PAIE: 'Fiche de paie',
  AUTRE: 'Autre',
}

const TYPE_COLORS = {
  ATTESTATION_SCOLARITE: 'blue',
  RELEVE_NOTES: 'violet',
  RECU_PAIEMENT: 'green',
  ATTESTATION_TRAVAIL: 'teal',
  BULLETIN: 'amber',
  FICHE_PAIE: 'gray',
  AUTRE: 'gray',
}

const TYPE_ICONS = {
  ATTESTATION_SCOLARITE: '📜',
  RELEVE_NOTES: '📊',
  RECU_PAIEMENT: '🧾',
  ATTESTATION_TRAVAIL: '💼',
  BULLETIN: '📋',
  FICHE_PAIE: '💰',
  AUTRE: '📄',
}

function DocumentModal({ onClose }) {
  const qc = useQueryClient()
  const { selectedCentreId } = useCentreStore()
  const [form, setForm] = useState({
    eleveId: '',
    personnelId: '',
    type: 'ATTESTATION_SCOLARITE',
    titre: '',
    anneeScolaire: '2025-2026',
    paiementId: '',
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isPersonnelType = PERSONNEL_TYPES.includes(form.type)

  const { data: elevesRes } = useQuery({
    queryKey: ['eleves-all', selectedCentreId],
    queryFn: () => elevesApi.getAll({ limit: 500, centreId: selectedCentreId || undefined })
  })
  const eleves = elevesRes?.data?.data || []

  const { data: personnelRes } = useQuery({
    queryKey: ['personnel-all', selectedCentreId],
    queryFn: () => personnelApi.getAll({ limit: 500, centreId: selectedCentreId || undefined }),
    enabled: isPersonnelType
  })
  const personnelList = personnelRes?.data?.data || []

  // Only fetched when generating a reçu, and only once an élève is picked -
  // lets the admin choose which paiement the reçu is for instead of always
  // getting whichever one happens to be most recent.
  const { data: paiementsRes } = useQuery({
    queryKey: ['eleve-paiements', form.eleveId],
    queryFn: () => caisseApi.getPaiements({ eleveId: form.eleveId, limit: 100 }),
    enabled: form.type === 'RECU_PAIEMENT' && !!form.eleveId
  })
  const paiements = paiementsRes?.data?.data || []

  const handleTypeChange = (type) => {
    const switchingKind = PERSONNEL_TYPES.includes(type) !== PERSONNEL_TYPES.includes(form.type)
    setForm(f => ({
      ...f,
      type,
      titre: TYPE_LABELS[type] + ' ' + f.anneeScolaire,
      paiementId: '',
      // Clear whichever selector no longer applies when switching between
      // an élève-type and a personnel-type document - a leftover eleveId
      // from ATTESTATION_SCOLARITE shouldn't silently ride along onto an
      // ATTESTATION_TRAVAIL submission.
      ...(switchingKind && { eleveId: '', personnelId: '' })
    }))
  }

  const { mutate, isPending } = useMutation({
    mutationFn: documentsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document généré')
      onClose()
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur')
  })

  const handleSubmit = () => {
    if (isPersonnelType) {
      if (!form.personnelId || !form.titre) {
        setError('Personnel et titre sont requis')
        return
      }
    } else if (!form.eleveId || !form.titre) {
      setError('Élève et titre sont requis')
      return
    }
    setError('')
    mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">📄 Générer un document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>
          )}

          {isPersonnelType ? (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Personnel *</label>
              <SearchSelect
                value={form.personnelId}
                onChange={v => set('personnelId', v)}
                placeholder="Rechercher un membre du personnel..."
                options={personnelList.map(p => ({
                  value: p.id,
                  label: `${p.utilisateur.prenom} ${p.utilisateur.nom}`,
                  sublabel: p.poste
                }))}
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Élève *</label>
              <SearchSelect
                value={form.eleveId}
                onChange={v => { set('eleveId', v); set('paiementId', '') }}
                placeholder="Rechercher un élève..."
                options={eleves.map(e => ({
                  value: e.id,
                  label: `${e.utilisateur.prenom} ${e.utilisateur.nom}`,
                  sublabel: e.matricule
                }))}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Type de document *</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES_DOCS.map(t => (
                <button key={t} type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-xs font-semibold transition ${form.type === t
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                  <span>{TYPE_ICONS[t]}</span>
                  <span className="truncate">{TYPE_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>

          {form.type === 'RECU_PAIEMENT' && form.eleveId && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Paiement</label>
              <select value={form.paiementId} onChange={e => set('paiementId', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option value="">Le plus récent (par défaut)</option>
                {paiements.map(p => (
                  <option key={p.id} value={p.id}>
                    {new Date(p.datePaiement).toLocaleDateString('fr-FR')} — {Number(p.montant).toLocaleString('fr-MA')} MAD ({p.typeFrais})
                  </option>
                ))}
              </select>
              {paiements.length === 0 && (
                <p className="mt-1 text-xs text-gray-400">Aucun paiement trouvé pour cet élève.</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Titre *</label>
            <input type="text" value={form.titre} onChange={e => set('titre', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Titre du document" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Année scolaire</label>
            <input type="text" value={form.anneeScolaire} onChange={e => set('anneeScolaire', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="2025-2026" />
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

export default function Documents() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { type, page }],
    queryFn: () => documentsApi.getAll({ type, page, limit: 15 }),
    keepPreviousData: true
  })

  const { mutate: remove } = useMutation({
    mutationFn: documentsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document supprimé')
    }
  })

  const documents = data?.data?.data || []
  const meta = data?.data?.meta || {}

const downloadPdf = async (id, numeroSerie) => {
  try {
    const res = await api.get(`/documents/${id}/pdf`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${numeroSerie}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('PDF error:', err)
    console.error('Response:', err.response)
    toast.error('Erreur lors de la génération du PDF')
  }
}

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {TYPES_DOCS.map(t => (
          <button key={t}
            onClick={() => setType(type === t ? '' : t)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition ${type === t
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
            <span className="text-2xl">{TYPE_ICONS[t]}</span>
            <span className="text-xs font-semibold text-gray-600 leading-tight">{TYPE_LABELS[t]}</span>
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? <Spinner /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Document</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Élève / Personnel</th>
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
                        {d.eleve
                          ? `${d.eleve.utilisateur.prenom} ${d.eleve.utilisateur.nom}`
                          : d.personnel
                            ? `${d.personnel.utilisateur.prenom} ${d.personnel.utilisateur.nom}`
                            : '—'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={TYPE_LABELS[d.type]} variant={TYPE_COLORS[d.type]} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{d.numeroSerie}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {d.genereParUser?.prenom} {d.genereParUser?.nom}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadPdf(d.id, d.numeroSerie)}
                          className="text-xs text-blue-500 hover:text-blue-700 font-semibold transition">
                          ⬇️ PDF
                        </button>
                        <button onClick={() => setConfirm(d)}
                          className="text-xs text-gray-400 hover:text-red-500 transition">
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!documents.length && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400">Aucun document trouvé</td>
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

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => remove(confirm.id)}
        title="Supprimer le document"
        message={`Supprimer "${confirm?.titre}" (${confirm?.numeroSerie}) ? Cette action est irréversible.`}
      />
    </div>
  )
}