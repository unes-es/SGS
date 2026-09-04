import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import { Suspense, lazy, useEffect } from 'react'
import { authApi } from './api/auth'
import usePageTitle from './hooks/usePageTitle'

// layouts
import PublicLayout from './components/layout/PublicLayout'
import AdminLayout from './components/layout/AdminLayout'

// public pages — kept as a normal (non-lazy) import since it's the first
// thing an unauthenticated visitor loads; no benefit to splitting it out.
import LandingPage from './pages/public/LandingPage'

// admin pages — lazy-loaded. None of these are ever seen by a public
// visitor, and only one is ever mounted at a time, so shipping all of them
// in the main bundle (the ~908KB warning at build time) was pure waste for
// every visitor who never logs in. LoginPage stays eager since it's the
// one admin route reachable without already being authenticated.
import LoginPage from './pages/admin/LoginPage'
// Public, unauthenticated (reached by scanning a document's QR code) - not
// under /admin, kept eager for the same reason LandingPage is: it's often
// the first (and only) page a given visitor ever loads on this site.
import Verify from './pages/public/Verify'
// Candidat/Étudiant portal (Phase 2.2) - all reached either directly (email
// links) or as a first landing page, same "kept eager" reasoning as above.
// Distinct from the existing /admin/portail "Soon" placeholder, which is
// the still-deferred Portail Parents, not this.
import CandidatLoginPage from './pages/portal/CandidatLoginPage'
import ForgotPasswordPage from './pages/portal/ForgotPasswordPage'
import ResetPasswordPage from './pages/portal/ResetPasswordPage'
import PortailPage from './pages/portal/PortailPage'
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Eleves = lazy(() => import('./pages/admin/Eleves'))
const Absences = lazy(() => import('./pages/admin/Absences'))
const Classes = lazy(() => import('./pages/admin/Classes'))
const Notes = lazy(() => import('./pages/admin/Notes'))
const Personnel = lazy(() => import('./pages/admin/Personnel'))
const Caisse = lazy(() => import('./pages/admin/Caisse'))
const Documents = lazy(() => import('./pages/admin/Documents'))
const Filieres = lazy(() => import('./pages/admin/Filieres'))
const Salaires = lazy(() => import('./pages/admin/Salaires'))
const Emplois = lazy(() => import('./pages/admin/Emplois'))
const Candidatures = lazy(() => import('./pages/admin/Candidatures'))
const Notifications = lazy(() => import('./pages/admin/Notifications'))
const Rapports = lazy(() => import('./pages/admin/Rapports'))
const Parametres = lazy(() => import('./pages/admin/Parametres'))
const Users = lazy(() => import('./pages/admin/Users'))
const Actualites = lazy(() => import('./pages/admin/Actualites'))
const Evenements = lazy(() => import('./pages/admin/Evenements'))
const Messages = lazy(() => import('./pages/admin/Messages'))

function ProtectedRoute({ children }) {
  const { accessToken, user } = useAuthStore()

  if (!user) return <Navigate to="/admin/login" replace />
  if (!accessToken) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return children
}

// Same shape as ProtectedRoute, but for the external CANDIDAT/ETUDIANT
// portal rather than staff - a staff member hitting /portail (or a
// candidat somehow hitting /admin) gets redirected to their own login,
// not just refused, since the wrong login page is the actual mistake.
function PortalRoute({ children }) {
  const { accessToken, user } = useAuthStore()

  if (!user || !['CANDIDAT', 'ETUDIANT'].includes(user.role)) {
    return <Navigate to="/candidat/login" replace />
  }
  if (!accessToken) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return children
}

const Soon = ({ name }) => (
  <div className="flex items-center justify-center h-64 text-gray-400">
    <div className="text-center">
      <div className="text-4xl mb-3">🚧</div>
      <div className="font-semibold">{name} — Bientôt disponible</div>
    </div>
  </div>
)

function AuthInit({ children }) {
  const { user, accessToken, setAuth, logout } = useAuthStore()

  useEffect(() => {
    if (user && !accessToken) {
      authApi.refresh()
        .then(({ data }) => setAuth(data.accessToken, user))
        .catch(() => logout())
    }
  }, [])

  return children
}

// Reuses ProtectedRoute's own spinner styling so a lazy admin chunk
// loading feels like the same brief pause as the auth-refresh spinner
// above, not a visually distinct loading state.
const RouteFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
)

// Just a hook call - usePageTitle needs Router context (useLocation),
// which App() itself doesn't have at the point it renders <BrowserRouter>.
function PageTitleEffect() {
  usePageTitle()
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <PageTitleEffect />
      <AuthInit>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Admin login — no layout */}
            <Route path="/admin/login" element={<LoginPage />} />

            {/* Document verification — no layout, no auth */}
            <Route path="/verify/:numeroSerie" element={<Verify />} />

            {/* Candidat/Étudiant portal (Phase 2.2) */}
            <Route path="/candidat/login" element={<CandidatLoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/portail" element={
              <PortalRoute>
                <PortailPage />
              </PortalRoute>
            } />

            {/* Admin — protected */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="eleves" element={<Eleves />} />
              <Route path="eleves/new" element={<Eleves />} />
              <Route path="absences" element={<Absences />} />
              <Route path="classes" element={<Classes />} />
              <Route path="notes" element={<Notes />} />
              <Route path="personnel" element={<Personnel />} />
              <Route path="caisse" element={<Caisse />} />
              <Route path="documents" element={<Documents />} />
              <Route path="filieres" element={<Filieres />} />
              <Route path="salaires" element={<Salaires />} />
              <Route path="emplois" element={<Emplois />} />
              <Route path="candidatures" element={<Candidatures />} />
              <Route path="notifications" element={<Notifications/>} />
              <Route path="portail" element={<Soon name="Portail Parents" />} />
              <Route path="actualites" element={<Actualites />} />
              <Route path="evenements" element={<Evenements />} />
              <Route path="messages" element={<Messages />} />
              <Route path="parametres" element={<Parametres />} />
              <Route path="rapports" element={<Rapports />} />
              <Route path="utilisateurs" element={<Users />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthInit>
    </BrowserRouter>
  )
}
