import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salairesApi } from '../../api/salaires'
import { personnelApi } from '../../api/personnel'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import StatCard from '../../components/ui/StatCard'
import { toast } from 'sonner'

const MODES = ['VIREMENT', 'ESPECES', 'CHEQUE']
const MOIS_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function SalaireModal({ onClose }) {
  const qc = useQueryClient()
  const now = new Date()
  const [form, setForm] = useState({
    personnelId: '',
    mois: now.getMonth() + 1,
    annee: now.getFullYear(),
    montantBrut: '',
    deductions: 0,
    montantNet: '',
    modePaiement: 'VIREMENT',
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // auto-compute net
  const handleBrutChange = (v) => {
    set('montantBrut', v)
    set('montantNet', Math.max(0, parseFloat(v || 0) - parseFloat(form.deductions || 0)))
  }
  const handleDeductChange = (v) => {
    set('deductions', v)
    set('montantNet', Math.max(0, parseFloat(form.montantBrut || 0) - parseFloat(v || 0)))
  }

  const { data: personnelRes } = useQuery({
    queryKey: ['personnel-all'],
    queryFn: () => personnelApi.getAll()
  })
  const personnel = personnelRes?.data?.data || []

  const { mutate, isPending } = useMutation({
    mutationFn: salairesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salaires'] })
      qc.invalidateQueries({ queryKey: ['salaires-stats'] })
      toast.success('Salaire créé')
      onClose()
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur')
  })

  const handleSubmit = () => {
    if (!form.personnelId || !form.montantBrut) {
      setError('Personnel et montant brut sont requis')
      return
    }
    setError('')
    mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Nouveau salaire</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Membre du personnel *</label>
            <select value={form.personnelId} onChange={e => set('personnelId', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="">Choisir</option>
              {personnel.map(p => (
                <option key={p.id} value={p.id}>
                  {p.utilisateur.prenom} {p.utilisateur.nom} — {p.poste}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mois</label>
              <select value={form.mois} onChange={e => set('mois', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                {MOIS_LABELS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Année</label>
              <input type="number" value={form.annee} onChange={e => set('annee', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Brut (MAD) *</label>
              <input type="number" value={form.montantBrut} onChange={e => handleBrutChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Déductions</label>
              <input type="number" value={form.deductions} onChange={e => handleDeductChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Net (MAD)</label>
              <input type="number" value={form.montantNet} onChange={e => set('montantNet', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-gray-50" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mode de paiement</label>
            <select value={form.modePaiement} onChange={e => set('modePaiement', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              {MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
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

function PayerModal({ salaire, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    modePaiement: 'VIREMENT',
    datePaiement: new Date().toISOString().slice(0, 10)
  })

  const { mutate, isPending } = useMutation({
    mutationFn: () => salairesApi.payer(salaire.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salaires'] })
      qc.invalidateQueries({ queryKey: ['salaires-stats'] })
      toast.success('Salaire marqué comme payé')
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">💳 Marquer comme payé</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-sm">
            <div className="font-bold text-gray-900">
              {salaire.personnel.utilisateur.prenom} {salaire.personnel.utilisateur.nom}
            </div>
            <div className="text-gray-500 mt-1">
              {MOIS_LABELS[salaire.mois - 1]} {salaire.annee} · {parseFloat(salaire.montantNet).toLocaleString('fr-FR')} MAD
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mode de paiement</label>
            <select value={form.modePaiement} onChange={e => setForm(f => ({ ...f, modePaiement: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              {MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date de paiement</label>
            <input type="date" value={form.datePaiement}
              onChange={e => setForm(f => ({ ...f, datePaiement: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={() => mutate()} disabled={isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {isPending ? '...' : '✅ Confirmer le paiement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Salaires() {
  const now = new Date()
  const [modal, setModal] = useState(null)
  const [payer, setPayer] = useState(null)
  const [mois, setMois] = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())
  const [statut, setStatut] = useState('')
  const [search, setSearch] = useState('')

  const { data: statsRes } = useQuery({
    queryKey: ['salaires-stats', { mois, annee }],
    queryFn: () => salairesApi.getStats({ mois, annee })
  })

  const { data, isLoading } = useQuery({
    queryKey: ['salaires', { mois, annee, statut }],
    queryFn: () => salairesApi.getAll({ mois, annee, statut })
  })

  const stats = statsRes?.data?.data
  const salaires = (data?.data?.data || []).filter(s =>
    !search ||
    s.personnel.utilisateur.prenom.toLowerCase().includes(search.toLowerCase()) ||
    s.personnel.utilisateur.nom.toLowerCase().includes(search.toLowerCase()) ||
    s.personnel.poste.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Salaires</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion de la paie</p>
        </div>
        <button onClick={() => setModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          ➕ Nouveau salaire
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        <StatCard icon="💰" bg="bg-blue-50" label="Total masse salariale" value={`${(stats?.total || 0).toLocaleString('fr-FR')} MAD`} />
        <StatCard icon="✅" bg="bg-emerald-50" label="Payés" value={`${(stats?.paye || 0).toLocaleString('fr-FR')} MAD`} />
        <StatCard icon="⏳" bg="bg-amber-50" label="En attente" value={`${(stats?.enAttente || 0).toLocaleString('fr-FR')} MAD`} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 lg:gap-3 flex-wrap">
        <input
          type="text"
          placeholder="🔍 Nom, poste..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:w-48 focus:outline-none focus:border-blue-500 transition"
        />
        <select value={mois} onChange={e => setMois(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          {MOIS_LABELS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={annee} onChange={e => setAnnee(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:border-blue-500" />
        <select value={statut} onChange={e => setStatut(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          <option value="">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="PAYE">Payé</option>
        </select>
      </div>

      <Card>
        {isLoading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Personnel</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Période</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Brut</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Déductions</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Net</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Statut</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {salaires.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-gray-900">
                      {s.personnel.utilisateur.prenom} {s.personnel.utilisateur.nom}
                    </div>
                    <div className="text-xs text-gray-400">{s.personnel.poste}</div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {MOIS_LABELS[s.mois - 1]} {s.annee}
                  </td>
                  <td className="px-5 py-3.5 text-gray-700">
                    {parseFloat(s.montantBrut).toLocaleString('fr-FR')} MAD
                  </td>
                  <td className="px-5 py-3.5 text-red-500">
                    {parseFloat(s.deductions) > 0 ? `−${parseFloat(s.deductions).toLocaleString('fr-FR')} MAD` : '—'}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-gray-900">
                    {parseFloat(s.montantNet).toLocaleString('fr-FR')} MAD
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge
                      label={s.statut === 'PAYE' ? 'Payé' : 'En attente'}
                      variant={s.statut === 'PAYE' ? 'green' : 'amber'}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    {s.statut === 'EN_ATTENTE' && (
                      <button onClick={() => setPayer(s)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition">
                        💳 Payer
                      </button>
                    )}
                    {s.statut === 'PAYE' && s.datePaiement && (
                      <div className="text-xs text-gray-400">
                        {new Date(s.datePaiement).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!salaires.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="text-4xl mb-3">💰</div>
                    <div className="font-semibold text-gray-500">
                      {search ? 'Aucun résultat' : 'Aucun salaire pour cette période'}
                    </div>
                    {!search && (
                      <div className="text-sm text-gray-400 mt-1">
                        Cliquez sur "Nouveau salaire" pour en créer un
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {modal && <SalaireModal onClose={() => setModal(null)} />}
      {payer && <PayerModal salaire={payer} onClose={() => setPayer(null)} />}
    </div>
  )
}