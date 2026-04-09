import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { caisseApi } from '../../api/caisse'
import { elevesApi } from '../../api/eleves'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import StatCard from '../../components/ui/StatCard'

const MODES_PAIEMENT = ['ESPECES', 'VIREMENT', 'CHEQUE', 'EN_LIGNE']
const TYPES_FRAIS = ['INSCRIPTION', 'SCOLARITE', 'AUTRE']
const MODE_COLORS = { ESPECES: 'green', VIREMENT: 'blue', CHEQUE: 'amber', EN_LIGNE: 'violet' }
const FRAIS_COLORS = { INSCRIPTION: 'blue', SCOLARITE: 'teal', AUTRE: 'gray' }

// ── PAIEMENT MODAL ─────────────────────────────────
function PaiementModal({ onClose, caisses }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    eleveId: '',
    caisseId: caisses[0]?.id || '',
    typeFrais: 'SCOLARITE',
    montant: '',
    modePaiement: 'ESPECES',
    datePaiement: new Date().toISOString().slice(0, 10),
    periodeMois: new Date().getMonth() + 1,
    periodeAnnee: new Date().getFullYear(),
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data: elevesRes } = useQuery({
    queryKey: ['eleves-all'],
    queryFn: () => elevesApi.getAll({ limit: 200 })
  })
  const eleves = elevesRes?.data?.data || []

  const { mutate, isPending } = useMutation({
    mutationFn: caisseApi.createPaiement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paiements'] })
      qc.invalidateQueries({ queryKey: ['caisse-stats'] })
      toast.success('Paiement enregistré')
      onClose()
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur')
  })

  const handleSubmit = () => {
    if (!form.eleveId || !form.montant || !form.caisseId) {
      setError('Élève, caisse et montant sont requis')
      return
    }
    setError('')
    mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">💰 Encaissement</h2>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type de frais *</label>
              <select value={form.typeFrais} onChange={e => set('typeFrais', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                {TYPES_FRAIS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Caisse *</label>
              <select value={form.caisseId} onChange={e => set('caisseId', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                {caisses.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Montant (MAD) *</label>
              <input type="number" value={form.montant} onChange={e => set('montant', e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mode de paiement *</label>
              <select value={form.modePaiement} onChange={e => set('modePaiement', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                {MODES_PAIEMENT.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date du paiement</label>
            <input type="date" value={form.datePaiement} onChange={e => set('datePaiement', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {form.typeFrais === 'SCOLARITE' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mois</label>
                <select value={form.periodeMois} onChange={e => set('periodeMois', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Année</label>
                <input type="number" value={form.periodeAnnee} onChange={e => set('periodeAnnee', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {isPending ? 'Enregistrement...' : '✅ Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── BON DE CAISSE MODAL ────────────────────────────
function BonModal({ onClose, caisses }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    caisseId: caisses[0]?.id || '',
    type: 'SORTIE',
    montant: '',
    motif: '',
    dateOperation: new Date().toISOString().slice(0, 10),
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: caisseApi.createBon,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bons'] })
      qc.invalidateQueries({ queryKey: ['caisse-stats'] })
      toast.success('Bon de caisse créé')
      onClose()
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur')
  })

  const handleSubmit = () => {
    if (!form.montant || !form.motif || !form.caisseId) {
      setError('Caisse, montant et motif sont requis')
      return
    }
    setError('')
    mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">🧾 Bon de caisse</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type *</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option value="SORTIE">Sortie (dépense)</option>
                <option value="ENTREE">Entrée (recette)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Caisse *</label>
              <select value={form.caisseId} onChange={e => set('caisseId', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                {caisses.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Montant (MAD) *</label>
            <input type="number" value={form.montant} onChange={e => set('montant', e.target.value)}
              placeholder="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Motif *</label>
            <input type="text" value={form.motif} onChange={e => set('motif', e.target.value)}
              placeholder="Achat fournitures, avance salaire..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date *</label>
            <input type="date" value={form.dateOperation} onChange={e => set('dateOperation', e.target.value)}
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
              {isPending ? 'Enregistrement...' : '✅ Créer le bon'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────
export default function Caisse() {
  const [tab, setTab] = useState('paiements')
  const [modalType, setModalType] = useState(null)
  const [pagePaie, setPagePaie] = useState(1)
  const [pageBons, setPageBons] = useState(1)

  const { data: statsRes } = useQuery({ queryKey: ['caisse-stats'], queryFn: caisseApi.getStats })
  const { data: caissesRes } = useQuery({ queryKey: ['caisses'], queryFn: caisseApi.getCaisses })
  const { data: paieRes, isLoading: paieLoading } = useQuery({
    queryKey: ['paiements', pagePaie],
    queryFn: () => caisseApi.getPaiements({ page: pagePaie, limit: 15 }),
    keepPreviousData: true
  })
  const { data: bonsRes, isLoading: bonsLoading } = useQuery({
    queryKey: ['bons', pageBons],
    queryFn: () => caisseApi.getBons({ page: pageBons, limit: 15 }),
    keepPreviousData: true
  })

  const stats = statsRes?.data?.data
  const caisses = caissesRes?.data?.data || []
  const paiements = paieRes?.data?.data || []
  const paieMeta = paieRes?.data?.meta || {}
  const bons = bonsRes?.data?.data || []
  const bonsMeta = bonsRes?.data?.meta || {}

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Caisse & Finances</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion financière</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalType('bon')}
            className="border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition">
            🧾 Bon de caisse
          </button>
          <button onClick={() => setModalType('paiement')}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
            💰 Encaissement
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💵" bg="bg-emerald-50"
          label="Solde total (MAD)"
          value={stats?.soldeTotal?.toLocaleString('fr-FR') ?? '—'} />
        <StatCard icon="📈" bg="bg-blue-50"
          label="Entrées ce mois"
          value={stats?.entresMois?.toLocaleString('fr-FR') ?? '—'} />
        <StatCard icon="📉" bg="bg-rose-50"
          label="Sorties ce mois"
          value={stats?.sortiesMois?.toLocaleString('fr-FR') ?? '—'} />
        <StatCard icon="⚠️" bg="bg-amber-50"
          label="Élèves impayés"
          value={stats?.impayesCount ?? '—'} />
      </div>

      {/* Caisses strip */}
      <div className="flex gap-3 flex-wrap">
        {caisses.map(c => (
          <div key={c.id}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-lg">🏦</div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">{c.nom}</div>
              <div className="text-emerald-600 font-bold text-sm">
                {parseFloat(c.soldeActuel).toLocaleString('fr-FR')} MAD
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'paiements', label: '💳 Paiements élèves' },
          { key: 'bons', label: '🧾 Bons de caisse' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${tab === t.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Paiements tab */}
      {tab === 'paiements' && (
        <Card>
          {paieLoading ? <Spinner /> : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Élève</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Type</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Montant</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Mode</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Date</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Référence</th>
                  </tr>
                </thead>
                <tbody>
                  {paiements.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-900">
                          {p.eleve.utilisateur.prenom} {p.eleve.utilisateur.nom}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge label={p.typeFrais} variant={FRAIS_COLORS[p.typeFrais]} />
                      </td>
                      <td className="px-5 py-3.5 font-bold text-emerald-600">
                        +{parseFloat(p.montant).toLocaleString('fr-FR')} MAD
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge label={p.modePaiement} variant={MODE_COLORS[p.modePaiement]} />
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {new Date(p.datePaiement).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{p.reference}</td>
                    </tr>
                  ))}
                  {!paiements.length && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                        Aucun paiement
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {paieMeta.totalPages > 1 && (
                <Pagination meta={paieMeta} page={pagePaie} setPage={setPagePaie} />
              )}
            </>
          )}
        </Card>
      )}

      {/* Bons tab */}
      {tab === 'bons' && (
        <Card>
          {bonsLoading ? <Spinner /> : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Numéro</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Type</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Montant</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Motif</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Caisse</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bons.map(b => (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{b.numero}</td>
                      <td className="px-5 py-3.5">
                        <Badge
                          label={b.type}
                          variant={b.type === 'ENTREE' ? 'green' : 'red'}
                        />
                      </td>
                      <td className={`px-5 py-3.5 font-bold ${b.type === 'ENTREE' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {b.type === 'ENTREE' ? '+' : '−'}{parseFloat(b.montant).toLocaleString('fr-FR')} MAD
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{b.motif}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{b.caisse?.nom}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {new Date(b.dateOperation).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                  {!bons.length && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                        Aucun bon de caisse
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {bonsMeta.totalPages > 1 && (
                <Pagination meta={bonsMeta} page={pageBons} setPage={setPageBons} />
              )}
            </>
          )}
        </Card>
      )}

      {modalType === 'paiement' && (
        <PaiementModal caisses={caisses} onClose={() => setModalType(null)} />
      )}
      {modalType === 'bon' && (
        <BonModal caisses={caisses} onClose={() => setModalType(null)} />
      )}
    </div>
  )
}

function Pagination({ meta, page, setPage }) {
  return (
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
  )
}