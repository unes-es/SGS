import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import { useEffect } from 'react'
import { authApi } from './api/auth'

// layouts
import PublicLayout  from './components/layout/PublicLayout'
import AdminLayout   from './components/layout/AdminLayout'

// public pages
import LandingPage   from './pages/public/LandingPage'

// admin pages
import LoginPage     from './pages/admin/LoginPage'
import Dashboard     from './pages/admin/Dashboard'
import Eleves        from './pages/admin/Eleves'
import Absences      from './pages/admin/Absences'
import Classes       from './pages/admin/Classes'
import Notes         from './pages/admin/Notes'
import Personnel     from './pages/admin/Personnel'
import Caisse        from './pages/admin/Caisse'
import Documents     from './pages/admin/Documents'
import Filieres      from './pages/admin/Filieres'
import Salaires      from './pages/admin/Salaires'
import Emplois       from './pages/admin/Emplois'

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

export default function App() {
  return (
    <BrowserRouter>
    <AuthInit>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* Admin login — no layout */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin — protected */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index                   element={<Dashboard />} />
          <Route path="eleves"           element={<Eleves />} />
          <Route path="eleves/new"       element={<Eleves />} />
          <Route path="absences"         element={<Absences />} />
          <Route path="classes"          element={<Classes />} />
          <Route path="notes"            element={<Notes />} />
          <Route path="personnel"        element={<Personnel />} />
          <Route path="caisse"           element={<Caisse />} />
          <Route path="documents"        element={<Documents />} />
          <Route path="filieres"         element={<Filieres />} />
          <Route path="salaires"         element={<Salaires />} />
          <Route path="emplois"          element={<Emplois />} />
          <Route path="candidatures"     element={<Soon name="Candidatures" />} />
          <Route path="notifications"    element={<Soon name="Notifications" />} />
          <Route path="portail"          element={<Soon name="Portail Parents" />} />
          <Route path="rapports"         element={<Soon name="Rapports" />} />
          <Route path="vitrine"          element={<Soon name="Site Vitrine" />} />
          <Route path="parametres"       element={<Soon name="Paramètres" />} />
          <Route index element={<Dashboard />} />
        </Route>
      </Routes>
      </AuthInit>
    </BrowserRouter>
  )
}