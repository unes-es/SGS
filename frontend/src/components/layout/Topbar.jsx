import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import { notificationsApi } from '../../api/notifications'
import { useNavigate } from 'react-router-dom'

const TITLES = {
  '/admin':              { title: 'Tableau de bord',    sub: 'Vue d\'ensemble' },
  '/admin/eleves':       { title: 'Élèves',             sub: 'Gestion des dossiers' },
  '/admin/absences':     { title: 'Absences',           sub: 'Suivi des présences' },
  '/admin/classes':      { title: 'Classes & EDT',      sub: 'Structure pédagogique' },
  '/admin/filieres':     { title: 'Filières',           sub: 'Gestion des filières' },
  '/admin/emplois':      { title: 'Emplois du temps',   sub: 'Planning hebdomadaire' },
  '/admin/notes':        { title: 'Notes',              sub: 'Évaluations et bulletins' },
  '/admin/personnel':    { title: 'Personnel',          sub: 'Ressources humaines' },
  '/admin/salaires':     { title: 'Salaires',           sub: 'Gestion de la paie' },
  '/admin/caisse':       { title: 'Caisse & Finances',  sub: 'Gestion financière' },
  '/admin/documents':    { title: 'Documents',          sub: 'Attestations et archives' },
  '/admin/candidatures': { title: 'Candidatures',       sub: 'Inscriptions en ligne' },
  '/admin/notifications':{ title: 'Notifications',      sub: 'Alertes et messages' },
  '/admin/portail':      { title: 'Portail Parents',    sub: 'Accès familles' },
  '/admin/rapports':     { title: 'Rapports & KPI',     sub: 'Tableaux de bord' },
  '/admin/vitrine':      { title: 'Site Vitrine',       sub: 'Contenu public' },
  '/admin/parametres':   { title: 'Paramètres',         sub: 'Configuration' },
}

const TYPE_ICONS = {
  IMPAYES:     '💸',
  ABSENCE:     '📅',
  CANDIDATURE: '📋',
  PAIEMENT:    '💰',
  SYSTEME:     '⚙️',
}

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)
  const info = TITLES[pathname] || { title: 'SGS', sub: '' }

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/admin/login')
  }

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: notifRes } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationsApi.getAll({ limit: 10 }),
    refetchInterval: 30000 // refresh every 30 seconds
  })

  const notifications = notifRes?.data?.data || []
  const unread        = notifRes?.data?.meta?.unread || 0

  const { mutate: markRead } = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] })
  })

  const { mutate: markAllRead } = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] })
  })

  const handleNotifClick = (n) => {
    if (!n.isRead) markRead(n.id)
    if (n.link) navigate(n.link)
    setNotifOpen(false)
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 sticky top-0 z-40">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition flex-shrink-0">
        ☰
      </button>

      <div className="min-w-0">
        <div className="text-base font-bold text-gray-900 leading-none truncate">{info.title}</div>
        {info.sub && <div className="text-xs text-gray-400 mt-0.5 hidden sm:block">{info.sub}</div>}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-400 w-48 cursor-text">
          <span>🔍</span>
          <span>Rechercher...</span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
            🔔
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">Notifications</span>
                {unread > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition">
                    Tout marquer lu
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400">
                    <div className="text-2xl mb-1">🔔</div>
                    <div className="text-sm">Aucune notification</div>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition border-b border-gray-50 ${
                        !n.isRead ? 'bg-blue-50/50' : ''
                      }`}>
                      <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {n.titre}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 leading-snug">{n.message}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2 border-t border-gray-100">
                <button
                  onClick={() => { navigate('/admin/notifications'); setNotifOpen(false) }}
                  className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-semibold py-1 transition">
                  Voir toutes les notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-gray-700">{user?.prenom}</span>
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