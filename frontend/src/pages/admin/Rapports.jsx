import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from '../../api/axios'
import { useCentreStore } from '../../store/centreStore'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts'

const TABS = ['Financier', 'Présence', 'Réussite', 'Export SAGE']

const currentYear = new Date().getFullYear()
const YEARS = [currentYear, currentYear - 1, currentYear - 2]
const MONTHS = [
  { val: '', label: 'Toute l\'année' },
  { val: '01', label: 'Janvier' }, { val: '02', label: 'Février' },
  { val: '03', label: 'Mars' },    { val: '04', label: 'Avril' },
  { val: '05', label: 'Mai' },     { val: '06', label: 'Juin' },
  { val: '07', label: 'Juillet' }, { val: '08', label: 'Août' },
  { val: '09', label: 'Septembre' },{ val: '10', label: 'Octobre' },
  { val: '11', label: 'Novembre' }, { val: '12', label: 'Décembre' },
]

export default function Rapports() {
  const { selectedCentreId } = useCentreStore()
  const centreId = selectedCentreId || undefined
  const [activeTab, setActiveTab] = useState('Financier')
  const [annee, setAnnee] = useState(String(currentYear))
  const [mois, setMois] = useState('')
  const [exporting, setExporting] = useState(false)

  // Financier
  const { data: financier, isLoading: loadingFin } = useQuery({
    queryKey: ['rapports-financier', annee, mois, centreId],
    queryFn: () => axios.get('/rapports/financier', { params: { annee, mois, centreId } }).then(r => r.data.data),
    enabled: activeTab === 'Financier',
  })

  // Présence
  const { data: presence, isLoading: loadingPres } = useQuery({
    queryKey: ['rapports-presence', annee, mois, centreId],
    queryFn: () => axios.get('/rapports/presence', { params: { annee, mois, centreId } }).then(r => r.data.data),
    enabled: activeTab === 'Présence',
  })

  // Réussite
  const { data: reussite, isLoading: loadingReus } = useQuery({
    queryKey: ['rapports-reussite', annee, mois, centreId],
    queryFn: () => axios.get('/rapports/reussite', { params: { annee, mois, centreId } }).then(r => r.data.data),
    enabled: activeTab === 'Réussite',
  })

  const handleExportFEC = async () => {
    setExporting(true)
    try {
      const res = await axios.get('/rapports/export-fec', {
        params: { annee, mois, centreId },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `FEC-SGS-${annee}-${mois || 'annuel'}.txt`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Erreur lors de l\'export FEC')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports & KPI</h1>
          <p className="text-sm text-gray-500 mt-1">Statistiques et exports comptables</p>
        </div>
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={annee}
            onChange={e => setAnnee(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={mois}
            onChange={e => setMois(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'Financier' && (
        <FinancierTab data={financier} loading={loadingFin} />
      )}
      {activeTab === 'Présence' && (
        <PresenceTab data={presence} loading={loadingPres} />
      )}
      {activeTab === 'Réussite' && (
        <ReussiteTab data={reussite} loading={loadingReus} />
      )}
      {activeTab === 'Export SAGE' && (
        <ExportTab onExport={handleExportFEC} exporting={exporting} annee={annee} mois={mois} />
      )}
    </div>
  )
}

// ── Financier ────────────────────────────────────────────────
function FinancierTab({ data, loading }) {
  if (loading) return <Spinner />
  if (!data) return <Empty />

  const { totalEntrees, totalSorties, solde, paiements = [], parMois = [] } = data

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total Entrées" value={`${Number(totalEntrees || 0).toLocaleString('fr-MA')} MAD`} color="green" />
        <KpiCard label="Total Sorties" value={`${Number(totalSorties || 0).toLocaleString('fr-MA')} MAD`} color="red" />
        <KpiCard label="Solde Net" value={`${Number(solde || 0).toLocaleString('fr-MA')} MAD`} color="blue" />
      </div>

      {/* Bar chart revenus vs sorties par mois */}
      {parMois?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenus vs Dépenses par mois</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={parMois}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={v => `${Number(v).toLocaleString('fr-MA')} MAD`} />
              <Legend />
              <Bar dataKey="entrees" name="Entrées" fill="#22c55e" radius={[4,4,0,0]} />
              <Bar dataKey="sorties" name="Sorties" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Paiements table */}
      {paiements.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Paiements ({paiements.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Élève</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paiements.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">{new Date(p.datePaiement).toLocaleDateString('fr-MA')}</td>
                    <td className="px-4 py-2 font-medium">{p.eleve?.utilisateur?.prenom} {p.eleve?.utilisateur?.nom}</td>
                    <td className="px-4 py-2 text-gray-500">{p.typeFrais}</td>
                    <td className="px-4 py-2 text-right font-semibold text-green-600">{Number(p.montant).toLocaleString('fr-MA')} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Présence ─────────────────────────────────────────────────
function PresenceTab({ data, loading }) {
  if (loading) return <Spinner />
  if (!data) return <Empty />

  const { parClasse = [], parEleve = [] } = data

  return (
    <div className="space-y-6">
      {/* Par classe */}
      {parClasse.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Taux de présence par classe</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Classe</th>
                  <th className="px-4 py-2 text-right">Total absences</th>
                  <th className="px-4 py-2 text-right">Justifiées</th>
                  <th className="px-4 py-2 text-right">Taux présence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parClasse.map(c => (
                  <tr key={c.classeId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{c.nom}</td>
                    <td className="px-4 py-2 text-right">{c.totalAbsences}</td>
                    <td className="px-4 py-2 text-right text-green-600">{c.justifiees}</td>
                    <td className="px-4 py-2 text-right">
                      <TauxBadge taux={c.tauxPresence} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Par élève (top absents) */}
      {parEleve.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Top absences par élève</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Élève</th>
                  <th className="px-4 py-2 text-left">Classe</th>
                  <th className="px-4 py-2 text-right">Absences</th>
                  <th className="px-4 py-2 text-right">Justifiées</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parEleve.slice(0, 20).map(e => (
                  <tr key={e.eleveId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{e.nom} {e.prenom}</td>
                    <td className="px-4 py-2 text-gray-500">{e.classe}</td>
                    <td className="px-4 py-2 text-right text-red-600 font-semibold">{e.totalAbsences}</td>
                    <td className="px-4 py-2 text-right text-green-600">{e.justifiees}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Réussite ─────────────────────────────────────────────────
function ReussiteTab({ data, loading }) {
  if (loading) return <Spinner />
  if (!data) return <Empty />

  const { parFiliere = [], parClasse = [] } = data

  return (
    <div className="space-y-6">
      {parFiliere.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Taux de réussite par filière</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={parFiliere} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="filiere" width={120} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="tauxReussite" name="Taux réussite" fill="#3b82f6" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {parClasse.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Détail par classe</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Classe</th>
                  <th className="px-4 py-2 text-left">Filière</th>
                  <th className="px-4 py-2 text-right">Élèves</th>
                  <th className="px-4 py-2 text-right">Moyenne</th>
                  <th className="px-4 py-2 text-right">Taux réussite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parClasse.map(c => (
                  <tr key={c.classeId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{c.nom}</td>
                    <td className="px-4 py-2 text-gray-500">{c.filiere}</td>
                    <td className="px-4 py-2 text-right">{c.totalEleves}</td>
                    <td className="px-4 py-2 text-right">{c.moyenneClasse}/20</td>
                    <td className="px-4 py-2 text-right">
                      <TauxBadge taux={c.tauxReussite} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Export SAGE ───────────────────────────────────────────────
function ExportTab({ onExport, exporting, annee, mois }) {
  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Export FEC (Format des Écritures Comptables)</p>
        <p className="text-blue-600">Format standard importable dans SAGE, Ciel, et EBP. Contient toutes les entrées (paiements) et sorties (bons de caisse) de la période sélectionnée.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Période : </span>
          {mois ? `${mois}/${annee}` : `Année ${annee}`}
        </div>
        <div className="text-xs text-gray-400">
          Fichier généré : <code>FEC-SGS-{annee}-{mois || 'annuel'}.txt</code>
        </div>
        <button
          onClick={onExport}
          disabled={exporting}
          className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {exporting ? 'Génération...' : '📤 Télécharger le fichier FEC'}
        </button>
      </div>
    </div>
  )
}

// ── Shared components ─────────────────────────────────────────
function KpiCard({ label, value, color }) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-700',
    red:   'bg-red-50 border-red-200 text-red-700',
    blue:  'bg-blue-50 border-blue-200 text-blue-700',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  )
}

function TauxBadge({ taux }) {
  const val = Number(taux || 0)
  const color = val >= 80 ? 'bg-green-100 text-green-700' : val >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{val}%</span>
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
}

function Empty() {
  return <div className="text-center py-12 text-gray-400 text-sm">Aucune donnée pour cette période.</div>
}