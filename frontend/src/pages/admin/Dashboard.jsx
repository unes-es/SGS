import { useQueries } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { dashboardApi } from '../../api/dashboard'
import StatCard from '../../components/ui/StatCard'
import Card     from '../../components/ui/Card'
import Badge    from '../../components/ui/Badge'
import Spinner  from '../../components/ui/Spinner'

export default function Dashboard() {
  const { user } = useAuthStore()

  const [absStats, caisseStats, elevesRes, absencesRes] = useQueries({
    queries: [
      { queryKey: ['absences-stats'],  queryFn: dashboardApi.getAbsencesStats },
      { queryKey: ['caisse-stats'],    queryFn: dashboardApi.getCaisseStats },
      { queryKey: ['eleves-recent'],   queryFn: dashboardApi.getEleves },
      { queryKey: ['absences-recent'], queryFn: dashboardApi.getAbsences },
    ]
  })

  const abs     = absStats.data?.data?.data
  const caisse  = caisseStats.data?.data?.data
  const eleves  = elevesRes.data?.data?.data
  const absences = absencesRes.data?.data?.data

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
            <a href="/admin/eleves/new" className="bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
              ➕ Nouvel élève
            </a>
            <a href="/admin/absences" className="bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
              📅 Absences du jour
            </a>
            <a href="/admin/caisse" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
              💰 Encaissement
            </a>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {loading ? <Spinner /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon="📅" bg="bg-red-50"
            label="Absences aujourd'hui"
            value={abs?.today ?? '—'}
          />
          <StatCard
            icon="⚠️" bg="bg-amber-50"
            label="Non justifiées"
            value={abs?.unjustified ?? '—'}
          />
          <StatCard
            icon="💰" bg="bg-emerald-50"
            label="Solde caisse (MAD)"
            value={caisse?.soldeTotal?.toLocaleString('fr-FR') ?? '—'}
          />
          <StatCard
            icon="💸" bg="bg-rose-50"
            label="Impayés"
            value={caisse?.impayesCount ?? '—'}
          />
        </div>
      )}

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
                      <div className="font-semibold text-gray-900">
                        {e.utilisateur.prenom} {e.utilisateur.nom}
                      </div>
                      <div className="text-xs text-gray-400">{e.matricule}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {e.classe?.nom}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        label={e.statut}
                        variant={e.statut === 'ACTIF' ? 'green' : 'amber'}
                      />
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
                      <div className="font-semibold text-gray-900">
                        {a.eleve.utilisateur.prenom} {a.eleve.utilisateur.nom}
                      </div>
                      <div className="text-xs text-gray-400">{a.eleve.classe?.nom}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {new Date(a.dateAbsence).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        label={a.estJustifiee ? 'Oui' : 'Non'}
                        variant={a.estJustifiee ? 'green' : 'red'}
                      />
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