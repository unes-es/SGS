import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import { useQuery } from '@tanstack/react-query'
import { candidaturesApi } from '../../api/candidatures'
import { notificationsApi } from '../../api/notifications'

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch { }
    logout()
    navigate('/admin/login')
  }

  const handleNavClick = () => {
    if (window.innerWidth < 1024) onClose()
  }

  const { data: candStats } = useQuery({
    queryKey: ['candidatures-stats'],
    queryFn: candidaturesApi.getStats,
    refetchInterval: 60000
  })

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ limit: 1 }),
    refetchInterval: 30000
  })

  const pendingCandidatures = candStats?.data?.data?.enAttente || 0
  const unreadNotifs = notifData?.data?.meta?.unread || 0
  const BADGES = {
    '/admin/candidatures': pendingCandidatures,
    '/admin/notifications': unreadNotifs,
  }

  const NAV = [
  { section: 'GÉNÉRAL' },
  { icon: '📊', label: 'Tableau de bord', to: '/admin' },
  { section: 'PHASE 1' },
  { icon: '🎓', label: 'Élèves', to: '/admin/eleves' },
  { icon: '📅', label: 'Absences', to: '/admin/absences' },
  { icon: '🏫', label: 'Classes', to: '/admin/classes' },
  { icon: '📚', label: 'Filières', to: '/admin/filieres' },
  { icon: '🗓️', label: 'Emplois du temps', to: '/admin/emplois' },
  { icon: '📝', label: 'Notes', to: '/admin/notes' },
  { icon: '👥', label: 'Personnel', to: '/admin/personnel' },
  { icon: '💳', label: 'Salaires', to: '/admin/salaires' },
  { icon: '💰', label: 'Caisse', to: '/admin/caisse' },
  { icon: '📄', label: 'Documents', to: '/admin/documents' },
  { section: 'PHASE 2' },
  { icon: '📋', label: 'Candidatures', to: '/admin/candidatures', badge: pendingCandidatures },
  { icon: '🔔', label: 'Notifications', to: '/admin/notifications', badge: unreadNotifs },
  { icon: '👨‍👩‍👧', label: 'Portail Parents', to: '/admin/portail' },
  { icon: '📈', label: 'Rapports', to: '/admin/rapports' },
  { section: 'PHASE 3' },
  { icon: '🌍', label: 'Site Vitrine', to: '/admin/vitrine' },
  { icon: '⚙️', label: 'Paramètres', to: '/admin/parametres' },
]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        w-60 bg-gray-950 border-r border-gray-800 h-screen fixed top-0 left-0 flex flex-col z-50 overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-lg flex-shrink-0">
            🎓
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-sm leading-none">SGS</div>
            <div className="text-gray-500 text-xs mt-0.5">Gestion Scolaire</div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-white transition text-xl">
            ✕
          </button>
        </div>

        {/* Centre indicator */}
        <div className="mx-3 mt-3 px-3 py-2 bg-gray-900 rounded-lg border border-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
          <div className="min-w-0">
            <div className="text-gray-200 text-xs font-semibold truncate">
              {user?.centre?.nom || 'Centre'}
            </div>
            <div className="text-gray-500 text-xs">Changer ↓</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map((item, i) => {
            if (item.section) {
              return (
                <div key={i} className="px-3 pt-4 pb-1 text-xs font-bold text-gray-600 tracking-widest uppercase">
                  {item.section}
                </div>
              )
            }
            return (
              <NavLink
                key={i}
                to={item.to}
                end={item.to === '/admin'}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`
                }
              >
                <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
                <span className="truncate flex-1">{item.label}</span>
                {BADGES[item.to] > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {BADGES[item.to] > 99 ? '99+' : BADGES[item.to]}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-900 transition cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-gray-200 text-xs font-semibold truncate">
                {user?.prenom} {user?.nom}
              </div>
              <div className="text-gray-500 text-xs truncate">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-400 text-sm transition"
              title="Déconnexion">
              ⏻
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}