import { useState, useRef } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { portalApi } from '../../api/portal'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import MonCompteModal from '../../components/MonCompteModal'

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
const DOCUMENT_TYPES = [
  { value: 'CIN', label: 'CIN' },
  { value: 'DIPLOME', label: 'Diplôme' },
  { value: 'PHOTO', label: 'Photo' },
  { value: 'AUTRE', label: 'Autre' },
]

// Minimal landing dashboard - Sprint 1 needed something real behind login
// to actually prove the auth works end to end, not just a placeholder.
// Sprint 2 (this pass) adds document upload + the message/status timeline
// for CANDIDAT accounts. The fuller student dashboard (notes/absences/
// emploi du temps/paiements) is Sprint 3, still ahead.
export default function PortailPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isEtudiant = user?.role === 'ETUDIANT'
  const isParent = user?.role === 'PARENT'
  const [showMonCompte, setShowMonCompte] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState(null)

  const { data: childrenRes, isLoading: childrenLoading } = useQuery({
    queryKey: ['portal-children'],
    queryFn: portalApi.getMyChildren,
    enabled: isParent,
    retry: false
  })
  const children = childrenRes?.data?.data || []
  // Default to the first child once the list loads, so a single-child
  // parent (the common case) never has to pick from a selector at all.
  const activeChildId = selectedChildId || children[0]?.id

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
        <div className="flex items-center gap-3">
          <button onClick={() => setShowMonCompte(true)} className="text-xs text-gray-500 hover:text-blue-600 transition">
            Mon compte
          </button>
          <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-500 transition">
            Déconnexion
          </button>
        </div>
      </header>

      {showMonCompte && <MonCompteModal onClose={() => setShowMonCompte(false)} />}

      <main className="max-w-lg mx-auto p-4 pt-8 pb-16">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Bonjour {user?.prenom} 👋</h1>

        {isParent ? (
          <>
            <p className="text-sm text-gray-500 mb-6">Suivi de la scolarité de votre/vos enfant(s)</p>
            {childrenLoading ? (
              <div className="text-sm text-gray-400">Chargement...</div>
            ) : children.length === 0 ? (
              <Empty text="Aucun enfant lié à ce compte pour le moment." />
            ) : (
              <>
                {children.length > 1 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {children.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedChildId(c.id)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                          activeChildId === c.id
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-200 text-gray-500 hover:border-blue-300'
                        }`}
                      >
                        {c.utilisateur?.prenom} {c.utilisateur?.nom}
                      </button>
                    ))}
                  </div>
                )}
                {children.filter(c => c.id === activeChildId).map(c => (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                    <Row label="Matricule" value={c.matricule} />
                    <Row label="Classe" value={c.classe?.nom} />
                    <Row label="Filière" value={c.classe?.filiere?.nom} />
                    <Row label="Statut" value={c.statut} />
                  </div>
                ))}
                {activeChildId && <ChildDashboard eleveId={activeChildId} />}
              </>
            )}
          </>
        ) : isEtudiant ? (
          <>
            <p className="text-sm text-gray-500 mb-6">Votre dossier élève</p>
            {eleveLoading ? (
              <div className="text-sm text-gray-400">Chargement...</div>
            ) : eleve ? (
              <>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                  <Row label="Matricule" value={eleve.matricule} />
                  <Row label="Classe" value={eleve.classe?.nom} />
                  <Row label="Filière" value={eleve.classe?.filiere?.nom} />
                  <Row label="Statut" value={eleve.statut} />
                </div>
                <EleveDashboard />
              </>
            ) : (
              <Empty text="Dossier élève introuvable." />
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">Suivi de votre candidature</p>
            {candLoading ? (
              <div className="text-sm text-gray-400">Chargement...</div>
            ) : candidature ? (
              <>
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

                <DocumentsSection />
                <MessagesSection />
              </>
            ) : (
              <Empty text="Aucune candidature trouvée sur ce compte." />
            )}
          </>
        )}
      </main>
    </div>
  )
}

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
const JOURS_LABELS = { LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi', JEUDI: 'Jeudi', VENDREDI: 'Vendredi', SAMEDI: 'Samedi' }
const DOC_TYPE_LABELS = {
  ATTESTATION_SCOLARITE: 'Attestation de scolarité', RELEVE_NOTES: 'Relevé de notes',
  RECU_PAIEMENT: 'Reçu de paiement', BULLETIN: 'Bulletin', AUTRE: 'Autre'
}
const MODE_PAIEMENT_LABELS = { ESPECES: 'Espèces', VIREMENT: 'Virement', CHEQUE: 'Chèque', EN_LIGNE: 'En ligne' }
const TABS = [
  { key: 'notes', label: 'Notes' },
  { key: 'absences', label: 'Absences' },
  { key: 'emploi', label: 'Emploi du temps' },
  { key: 'paiements', label: 'Paiements' },
  { key: 'documents', label: 'Documents' },
]

// Sprint 3 (Phase 2.2) - Student Portal. Read-only everywhere: an élève
// views what staff already entered, never edits it here.
function EleveDashboard() {
  const [tab, setTab] = useState('notes')

  return (
    <div className="bg-white rounded-2xl border border-gray-200 mt-4 overflow-hidden">
      <div className="flex overflow-x-auto border-b border-gray-100">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tab === 'notes' && <NotesTab />}
        {tab === 'absences' && <AbsencesTab />}
        {tab === 'emploi' && <EmploiTab />}
        {tab === 'paiements' && <PaiementsTab />}
        {tab === 'documents' && <EleveDocumentsTab />}
      </div>
    </div>
  )
}

// Parent Portal (feature addition) - same tab layout as EleveDashboard,
// but every tab takes the selected child's eleveId and hits the
// eleveId-scoped portal endpoints (getChild*) instead of the implicit
// "my own record" ones. Kept as its own component rather than
// parameterizing EleveDashboard - the two have different data-fetching
// shapes (no-arg vs eleveId-keyed queries) and this codebase already
// favors explicit near-duplicates over a shared abstraction for this
// kind of per-tab structure (see NotesTab/AbsencesTab/... themselves).
function ChildDashboard({ eleveId }) {
  const [tab, setTab] = useState('notes')

  return (
    <div className="bg-white rounded-2xl border border-gray-200 mt-4 overflow-hidden">
      <div className="flex overflow-x-auto border-b border-gray-100">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tab === 'notes' && <ChildNotesTab eleveId={eleveId} />}
        {tab === 'absences' && <ChildAbsencesTab eleveId={eleveId} />}
        {tab === 'emploi' && <ChildEmploiTab eleveId={eleveId} />}
        {tab === 'paiements' && <ChildPaiementsTab eleveId={eleveId} />}
        {tab === 'documents' && <ChildDocumentsTab eleveId={eleveId} />}
      </div>
    </div>
  )
}

function ChildNotesTab({ eleveId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['portal-child-notes', eleveId],
    queryFn: () => portalApi.getChildNotes(eleveId)
  })
  const notes = data?.data?.data || []

  if (isLoading) return <div className="text-xs text-gray-400">Chargement...</div>
  if (notes.length === 0) return <div className="text-xs text-gray-400">Aucune note pour le moment.</div>

  return (
    <div className="space-y-2">
      {notes.map(n => (
        <div key={n.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-0">
          <div>
            <div className="font-semibold text-gray-900">{n.matiere?.nom}</div>
            <div className="text-gray-400">{n.periode} · {n.typeEval}</div>
          </div>
          <div className="font-bold text-gray-900">{Number(n.note)}/{Number(n.noteMax)}</div>
        </div>
      ))}
    </div>
  )
}

function ChildAbsencesTab({ eleveId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['portal-child-absences', eleveId],
    queryFn: () => portalApi.getChildAbsences(eleveId)
  })
  const absences = data?.data?.data || []

  if (isLoading) return <div className="text-xs text-gray-400">Chargement...</div>
  if (absences.length === 0) return <div className="text-xs text-gray-400">Aucune absence enregistrée.</div>

  return (
    <div className="space-y-2">
      {absences.map(a => (
        <div key={a.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-0">
          <div>
            <div className="font-semibold text-gray-900">
              {a.matiere?.nom || 'Journée complète'}
              {a.estJustifiee && <span className="ml-1.5 text-[10px] font-medium text-green-600">Justifiée</span>}
            </div>
            <div className="text-gray-400">{new Date(a.dateAbsence).toLocaleDateString('fr-FR')}{a.motif ? ` · ${a.motif}` : ''}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ChildEmploiTab({ eleveId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['portal-child-emploi', eleveId],
    queryFn: () => portalApi.getChildEmploiDuTemps(eleveId)
  })
  const emplois = data?.data?.data || []

  if (isLoading) return <div className="text-xs text-gray-400">Chargement...</div>
  if (emplois.length === 0) return <div className="text-xs text-gray-400">Emploi du temps non disponible.</div>

  const byJour = JOURS.reduce((acc, j) => { acc[j] = emplois.filter(e => e.jourSemaine === j); return acc }, {})

  return (
    <div className="space-y-3">
      {JOURS.filter(j => byJour[j].length > 0).map(jour => (
        <div key={jour}>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">{JOURS_LABELS[jour]}</div>
          <div className="space-y-1.5">
            {byJour[jour].map(e => (
              <div key={e.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                <div>
                  <div className="font-semibold text-gray-900">{e.matiere?.nom}</div>
                  <div className="text-gray-400">{e.professeur?.utilisateur?.prenom} {e.professeur?.utilisateur?.nom}{e.salle ? ` · Salle ${e.salle}` : ''}</div>
                </div>
                <div className="text-gray-600 font-medium shrink-0 ml-2">{e.heureDebut}–{e.heureFin}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ChildPaiementsTab({ eleveId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['portal-child-paiements', eleveId],
    queryFn: () => portalApi.getChildPaiements(eleveId)
  })
  const paiements = data?.data?.data || []

  if (isLoading) return <div className="text-xs text-gray-400">Chargement...</div>
  if (paiements.length === 0) return <div className="text-xs text-gray-400">Aucun paiement enregistré.</div>

  return (
    <div className="space-y-2">
      {paiements.map(p => (
        <div key={p.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-0">
          <div>
            <div className="font-semibold text-gray-900">{p.typeFrais} · {MODE_PAIEMENT_LABELS[p.modePaiement]}</div>
            <div className="text-gray-400">{new Date(p.datePaiement).toLocaleDateString('fr-FR')} · Réf. {p.reference}</div>
          </div>
          <div className="font-bold text-gray-900 shrink-0 ml-2">{Number(p.montant).toLocaleString('fr-FR')} DH</div>
        </div>
      ))}
    </div>
  )
}

function ChildDocumentsTab({ eleveId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['portal-child-documents', eleveId],
    queryFn: () => portalApi.getChildDocuments(eleveId)
  })
  const documents = data?.data?.data || []

  const handleDownload = async (doc) => {
    try {
      const res = await portalApi.getChildDocumentPdf(eleveId, doc.id)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = window.document.createElement('a')
      a.href = url
      a.download = `${doc.numeroSerie || doc.id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Erreur lors du téléchargement')
    }
  }

  if (isLoading) return <div className="text-xs text-gray-400">Chargement...</div>
  if (documents.length === 0) return <div className="text-xs text-gray-400">Aucun document disponible.</div>

  return (
    <div className="space-y-2">
      {documents.map(d => (
        <div key={d.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-0">
          <div>
            <div className="font-semibold text-gray-900">{DOC_TYPE_LABELS[d.type] || d.type}</div>
            <div className="text-gray-400">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</div>
          </div>
          <button onClick={() => handleDownload(d)} className="text-blue-600 hover:underline shrink-0 ml-2">
            Télécharger
          </button>
        </div>
      ))}
    </div>
  )
}

function NotesTab() {
  const { data, isLoading } = useQuery({ queryKey: ['portal-notes'], queryFn: portalApi.getMyNotes })
  const notes = data?.data?.data || []

  if (isLoading) return <div className="text-xs text-gray-400">Chargement...</div>
  if (notes.length === 0) return <div className="text-xs text-gray-400">Aucune note pour le moment.</div>

  return (
    <div className="space-y-2">
      {notes.map(n => (
        <div key={n.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-0">
          <div>
            <div className="font-semibold text-gray-900">{n.matiere?.nom}</div>
            <div className="text-gray-400">{n.periode} · {n.typeEval}</div>
          </div>
          <div className="font-bold text-gray-900">{Number(n.note)}/{Number(n.noteMax)}</div>
        </div>
      ))}
    </div>
  )
}

function AbsencesTab() {
  const { data, isLoading } = useQuery({ queryKey: ['portal-absences'], queryFn: portalApi.getMyAbsences })
  const absences = data?.data?.data || []

  if (isLoading) return <div className="text-xs text-gray-400">Chargement...</div>
  if (absences.length === 0) return <div className="text-xs text-gray-400">Aucune absence enregistrée.</div>

  return (
    <div className="space-y-2">
      {absences.map(a => (
        <div key={a.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-0">
          <div>
            <div className="font-semibold text-gray-900">
              {a.matiere?.nom || 'Journée complète'}
              {a.estJustifiee && <span className="ml-1.5 text-[10px] font-medium text-green-600">Justifiée</span>}
            </div>
            <div className="text-gray-400">{new Date(a.dateAbsence).toLocaleDateString('fr-FR')}{a.motif ? ` · ${a.motif}` : ''}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmploiTab() {
  const { data, isLoading } = useQuery({ queryKey: ['portal-emploi'], queryFn: portalApi.getMyEmploiDuTemps })
  const emplois = data?.data?.data || []

  if (isLoading) return <div className="text-xs text-gray-400">Chargement...</div>
  if (emplois.length === 0) return <div className="text-xs text-gray-400">Emploi du temps non disponible.</div>

  const byJour = JOURS.reduce((acc, j) => { acc[j] = emplois.filter(e => e.jourSemaine === j); return acc }, {})

  return (
    <div className="space-y-3">
      {JOURS.filter(j => byJour[j].length > 0).map(jour => (
        <div key={jour}>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">{JOURS_LABELS[jour]}</div>
          <div className="space-y-1.5">
            {byJour[jour].map(e => (
              <div key={e.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                <div>
                  <div className="font-semibold text-gray-900">{e.matiere?.nom}</div>
                  <div className="text-gray-400">{e.professeur?.utilisateur?.prenom} {e.professeur?.utilisateur?.nom}{e.salle ? ` · Salle ${e.salle}` : ''}</div>
                </div>
                <div className="text-gray-600 font-medium shrink-0 ml-2">{e.heureDebut}–{e.heureFin}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function PaiementsTab() {
  const { data, isLoading } = useQuery({ queryKey: ['portal-paiements'], queryFn: portalApi.getMyPaiements })
  const paiements = data?.data?.data || []

  if (isLoading) return <div className="text-xs text-gray-400">Chargement...</div>
  if (paiements.length === 0) return <div className="text-xs text-gray-400">Aucun paiement enregistré.</div>

  return (
    <div className="space-y-2">
      {paiements.map(p => (
        <div key={p.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-0">
          <div>
            <div className="font-semibold text-gray-900">{p.typeFrais} · {MODE_PAIEMENT_LABELS[p.modePaiement]}</div>
            <div className="text-gray-400">{new Date(p.datePaiement).toLocaleDateString('fr-FR')} · Réf. {p.reference}</div>
          </div>
          <div className="font-bold text-gray-900 shrink-0 ml-2">{Number(p.montant).toLocaleString('fr-FR')} DH</div>
        </div>
      ))}
    </div>
  )
}

function EleveDocumentsTab() {
  const { data, isLoading } = useQuery({ queryKey: ['portal-eleve-documents'], queryFn: portalApi.getMyEleveDocuments })
  const documents = data?.data?.data || []

  // PDFs are generated on demand (see documents.service.js), not stored
  // as static files - same blob-download pattern as the admin Documents
  // page, just against the ownership-checked portal endpoint.
  const handleDownload = async (doc) => {
    try {
      const res = await portalApi.getMyEleveDocumentPdf(doc.id)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = window.document.createElement('a')
      a.href = url
      a.download = `${doc.numeroSerie || doc.id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Erreur lors du téléchargement')
    }
  }

  if (isLoading) return <div className="text-xs text-gray-400">Chargement...</div>
  if (documents.length === 0) return <div className="text-xs text-gray-400">Aucun document disponible.</div>

  return (
    <div className="space-y-2">
      {documents.map(d => (
        <div key={d.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-0">
          <div>
            <div className="font-semibold text-gray-900">{DOC_TYPE_LABELS[d.type] || d.type}</div>
            <div className="text-gray-400">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</div>
          </div>
          <button onClick={() => handleDownload(d)} className="text-blue-600 hover:underline shrink-0 ml-2">
            Télécharger
          </button>
        </div>
      ))}
    </div>
  )
}

function DocumentsSection() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [pendingType, setPendingType] = useState(null)

  const { data } = useQuery({
    queryKey: ['portal-documents'],
    queryFn: portalApi.getMyDocuments,
  })
  const documents = data?.data?.data || []

  const { mutate: upload, isPending } = useMutation({
    mutationFn: ({ file, type }) => portalApi.addMyDocument(file, type),
    onSuccess: () => {
      toast.success('Document envoyé')
      queryClient.invalidateQueries({ queryKey: ['portal-documents'] })
    },
    onSettled: () => setPendingType(null)
  })

  const handlePick = (type) => {
    setPendingType(type)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !pendingType) return
    upload({ file, type: pendingType })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-4">
      <h2 className="text-sm font-bold text-gray-900 mb-3">Documents</h2>

      <input ref={fileInputRef} type="file" className="hidden" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={handleFileChange} />

      <div className="flex flex-wrap gap-2 mb-3">
        {DOCUMENT_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => handlePick(t.value)}
            disabled={isPending}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 transition"
          >
            {isPending && pendingType === t.value ? 'Envoi...' : `+ ${t.label}`}
          </button>
        ))}
      </div>

      {documents.length === 0 ? (
        <p className="text-xs text-gray-400">Aucun document envoyé pour le moment.</p>
      ) : (
        <ul className="space-y-1.5">
          {documents.map(doc => (
            <li key={doc.id} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">{DOCUMENT_TYPES.find(t => t.value === doc.type)?.label || doc.type}</span>
                {' — '}{doc.nomFichier}
              </span>
              <a href={doc.fichierUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline shrink-0 ml-2">
                Voir
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MessagesSection() {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')

  const { data } = useQuery({
    queryKey: ['portal-evenements'],
    queryFn: portalApi.getMyEvenements,
  })
  const evenements = data?.data?.data || []

  const { mutate: send, isPending } = useMutation({
    mutationFn: (msg) => portalApi.addMyMessage(msg),
    onSuccess: () => {
      setMessage('')
      queryClient.invalidateQueries({ queryKey: ['portal-evenements'] })
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim()) return
    send(message.trim())
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-4">
      <h2 className="text-sm font-bold text-gray-900 mb-3">Messages avec le secrétariat</h2>

      {evenements.length === 0 ? (
        <p className="text-xs text-gray-400 mb-3">Aucun message pour le moment.</p>
      ) : (
        <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
          {evenements.map(ev => (
            ev.type === 'STATUT_CHANGE' ? (
              <div key={ev.id} className="text-center text-[11px] text-gray-400 py-1">
                {ev.message} · {new Date(ev.createdAt).toLocaleDateString('fr-FR')}
              </div>
            ) : (
              <div key={ev.id} className={`flex ${ev.auteurRole === 'CANDIDAT' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                  ev.auteurRole === 'CANDIDAT' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                }`}>
                  <p>{ev.message}</p>
                  <p className={`text-[10px] mt-1 ${ev.auteurRole === 'CANDIDAT' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(ev.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={isPending || !message.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg px-4 transition"
        >
          Envoyer
        </button>
      </form>
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
