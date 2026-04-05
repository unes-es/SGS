import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import { useNavigate } from 'react-router-dom'

const TITLES = {
  '/admin': { title: 'Tableau de bord', sub: 'Vue d\'ensemble' },
  '/admin/eleves': { title: 'Élèves', sub: 'Gestion des dossiers' },
  '/admin/absences': { title: 'Absences', sub: 'Suivi des présences' },
  '/admin/classes': { title: 'Classes & EDT', sub: 'Structure pédagogique' },
  '/admin/notes': { title: 'Notes', sub: 'Évaluations et bulletins' },
  '/admin/personnel': { title: 'Personnel', sub: 'Ressources humaines' },
  '/admin/caisse': { title: 'Caisse & Finances', sub: 'Gestion financière' },
  '/admin/documents': { title: 'Documents', sub: 'Attestations et archives' },
  '/admin/candidatures': { title: 'Candidatures', sub: 'Inscriptions en ligne' },
  '/admin/notifications': { title: 'Notifications', sub: 'Alertes et messages' },
  '/admin/portail': { title: 'Portail Parents', sub: 'Accès familles' },
  '/admin/rapports': { title: 'Rapports & KPI', sub: 'Tableaux de bord' },
  '/admin/vitrine': { title: 'Site Vitrine', sub: 'Contenu public' },
  '/admin/parametres': { title: 'Paramètres', sub: 'Configuration' },
}

export default function Topbar() {
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const info = TITLES[pathname] || { title: 'SGS', sub: '' }

  // inside Topbar component add:
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = async () => {
    try { await authApi.logout() } catch { }
    logout()
    navigate('/admin/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 sticky top-0 z-40">
      <div>
        <div className="text-base font-bold text-gray-900 leading-none">{info.title}</div>
        {info.sub && <div className="text-xs text-gray-400 mt-0.5">{info.sub}</div>}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-400 w-48 cursor-text">
          <span>🔍</span>
          <span>Rechercher...</span>
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
          🔔
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <span className="text-sm font-semibold text-gray-700">{user?.prenom}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition"
            title="Déconnexion">
            ⏻
          </button>
        </div>
      </div>
    </header>
  )
}