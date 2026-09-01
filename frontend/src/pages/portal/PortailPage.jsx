import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { portalApi } from '../../api/portal'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

const STATUT_LABELS = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours d\'étude',
  ACCEPTEE: 'Acceptée',
  REFUSEE: 'Refusée',
}
const STATUT_COLORS = {
  EN_ATTENTE: 'bg-amber-100 text-amber-700',
  EN_COURS: 'bg-blue-100 text-blue-700',
  ACCEPTEE: 'bg-green-100 text-green-700',
  REFUSEE: 'bg-red-100 text-red-700',
}

// Minimal landing dashboard - Sprint 1 needed something real behind login
// to actually prove the auth works end to end, not just a placeholder.
// The fuller candidat dashboard (doc upload, messages, status timeline)
// is Sprint 2; the fuller student dashboard (notes/absences/emploi du
// temps/paiements) is Sprint 3 - both still ahead, this only shows status.
export default function PortailPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isEtudiant = user?.role === 'ETUDIANT'

  const { data: candRes, isLoading: candLoading } = useQuery({
    queryKey: ['portal-candidature'],
    queryFn: portalApi.getMyCandidature,
    enabled: !isEtudiant,
    retry: false
  })
  const { data: eleveRes, isLoading: eleveLoading } = useQuery({
    queryKey: ['portal-eleve'],
    queryFn: portalApi.getMyEleve,
    enabled: isEtudiant,
    retry: false
  })

  const candidature = candRes?.data?.data
  const eleve = eleveRes?.data?.data

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* intentionally ignored */ }
    logout()
    navigate('/candidat/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm">🎓</div>
          <span className="font-bold text-gray-900 text-sm">SGS — Mon espace</span>
        </div>
        <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-500 transition">
          Déconnexion
        </button>
      </header>

      <main className="max-w-lg mx-auto p-4 pt-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Bonjour {user?.prenom} 👋</h1>

        {isEtudiant ? (
          <>
            <p className="text-sm text-gray-500 mb-6">Votre dossier élève</p>
            {eleveLoading ? (
              <div className="text-sm text-gray-400">Chargement...</div>
            ) : eleve ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                <Row label="Matricule" value={eleve.matricule} />
                <Row label="Classe" value={eleve.classe?.nom} />
                <Row label="Filière" value={eleve.classe?.filiere?.nom} />
                <Row label="Statut" value={eleve.statut} />
              </div>
            ) : (
              <Empty text="Dossier élève introuvable." />
            )}
            <p className="text-xs text-gray-400 mt-4">Notes, absences, emploi du temps et paiements arrivent bientôt.</p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">Suivi de votre candidature</p>
            {candLoading ? (
              <div className="text-sm text-gray-400">Chargement...</div>
            ) : candidature ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Statut</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUT_COLORS[candidature.statut]}`}>
                    {STATUT_LABELS[candidature.statut]}
                  </span>
                </div>
                <Row label="Centre" value={candidature.centre?.nom} />
                {candidature.filiere && <Row label="Filière" value={candidature.filiere.nom} />}
                <Row label="Soumise le" value={new Date(candidature.createdAt).toLocaleDateString('fr-FR')} />
              </div>
            ) : (
              <Empty text="Aucune candidature trouvée sur ce compte." />
            )}
            <p className="text-xs text-gray-400 mt-4">Envoi de documents et messagerie avec le secrétariat arrivent bientôt.</p>
          </>
        )}
      </main>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-900">{value || '—'}</span>
    </div>
  )
}

function Empty({ text }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-400">
      {text}
    </div>
  )
}
