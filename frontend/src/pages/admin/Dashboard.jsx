import { useQueries } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { dashboardApi } from '../../api/dashboard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import StatCard from '../../components/ui/StatCard'
import Card     from '../../components/ui/Card'
import Badge    from '../../components/ui/Badge'
import Spinner  from '../../components/ui/Spinner'
import { Link } from 'react-router-dom'

const PIE_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4']

export default function Dashboard() {
  const { user } = useAuthStore()

  const [absStats, caisseStats, elevesRes, absencesRes, revenueRes, filiereRes] = useQueries({
    queries: [
      { queryKey: ['absences-stats'],       queryFn: dashboardApi.getAbsencesStats },
      { queryKey: ['caisse-stats'],         queryFn: dashboardApi.getCaisseStats },
      { queryKey: ['eleves-recent'],        queryFn: dashboardApi.getEleves },
      { queryKey: ['absences-recent'],      queryFn: dashboardApi.getAbsences },
      { queryKey: ['revenue-chart'],        queryFn: dashboardApi.getRevenueChart },
      { queryKey: ['eleves-par-filiere'],   queryFn: dashboardApi.getElevesParFiliere },
    ]
  })

  const abs      = absStats.data?.data?.data
  const caisse   = caisseStats.data?.data?.data
  const eleves   = elevesRes.data?.data?.data
  const absences = absencesRes.data?.data?.data
  const revenue  = revenueRes.data?.data?.data || []
  const parFiliere = filiereRes.data?.data?.data || []

  const loading = absStats.isLoading || caisseStats.isLoading

  return (
    <div className="space-y-6">

      {/* Welcome */}
      <div className="bg-gradient-to-r from-gray-950 to-blue-950 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-8xl opacity-10 pointer-events-none">🎓</div>
        <div className="relative z-10">
          <div className="text-xl font-bold">Bonjour, {user?.prenom} 👋</div>
          <div className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            <Link to="/admin/eleves" className="bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
              ➕ Nouvel élève
            </Link>
            <Link to="/admin/absences" className="bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
              📅 Absences du jour
            </Link>
            <Link to="/admin/caisse" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
              💰 Encaissement
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {loading ? <Spinner /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="📅" bg="bg-red-50"     label="Absences aujourd'hui" value={abs?.today ?? '—'} />
          <StatCard icon="⚠️" bg="bg-amber-50"   label="Non justifiées"       value={abs?.unjustified ?? '—'} />
          <StatCard icon="💰" bg="bg-emerald-50" label="Solde caisse (MAD)"   value={caisse?.soldeTotal?.toLocaleString('fr-FR') ?? '—'} />
          <StatCard icon="💸" bg="bg-rose-50"    label="Impayés"              value={caisse?.impayesCount ?? '—'} />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue bar chart */}
        <div className="lg:col-span-2">
          <Card title="📈 Revenus des 6 derniers mois">
            {revenueRes.isLoading ? <Spinner /> : (
              <div className="p-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenue} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip
                      formatter={(v) => [`${v.toLocaleString('fr-FR')} MAD`, 'Revenus']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <Bar dataKey="revenus" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* Élèves par filière donut */}
        <Card title="🎓 Élèves par filière">
          {filiereRes.isLoading ? <Spinner /> : (
            <div className="p-4">
              {parFiliere.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={parFiliere}
                      dataKey="eleves"
                      nameKey="nom"
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {parFiliere.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [v, n]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <div className="text-3xl mb-2">🎓</div>
                  <div className="text-sm">Aucune donnée</div>
                </div>
              )}
            </div>
          )}
        </Card>

      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent élèves */}
        <Card title="🎓 Derniers élèves inscrits">
          {elevesRes.isLoading ? <Spinner /> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-2.5">Élève</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-2.5">Classe</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-2.5">Statut</th>
                </tr>
              </thead>
              <tbody>
                {eleves?.map(e => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-gray-900">{e.utilisateur.prenom} {e.utilisateur.nom}</div>
                      <div className="text-xs text-gray-400">{e.matricule}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{e.classe?.nom}</td>
                    <td className="px-5 py-3">
                      <Badge label={e.statut} variant={e.statut === 'ACTIF' ? 'green' : 'amber'} />
                    </td>
                  </tr>
                ))}
                {!eleves?.length && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400 text-sm">Aucun élève</td></tr>
                )}
              </tbody>
            </table>
          )}
        </Card>

        {/* Recent absences */}
        <Card title="📅 Absences récentes">
          {absencesRes.isLoading ? <Spinner /> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-2.5">Élève</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-2.5">Date</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-2.5">Justifiée</th>
                </tr>
              </thead>
              <tbody>
                {absences?.map(a => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-gray-900">{a.eleve.utilisateur.prenom} {a.eleve.utilisateur.nom}</div>
                      <div className="text-xs text-gray-400">{a.eleve.classe?.nom}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{new Date(a.dateAbsence).toLocaleDateString('fr-FR')}</td>
                    <td className="px-5 py-3">
                      <Badge label={a.estJustifiee ? 'Oui' : 'Non'} variant={a.estJustifiee ? 'green' : 'red'} />
                    </td>
                  </tr>
                ))}
                {!absences?.length && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400 text-sm">Aucune absence</td></tr>
                )}
              </tbody>
            </table>
          )}
        </Card>

      </div>
    </div>
  )
}