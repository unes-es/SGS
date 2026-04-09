import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { personnelApi } from '../../api/personnel'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import StatCard from '../../components/ui/StatCard'
import { toast } from 'sonner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const CONTRAT_COLORS = {
  PERMANENT: 'blue',
  VACATAIRE: 'violet',
  ADMINISTRATIF: 'teal',
  STAGIAIRE: 'amber',
}

const TYPES_CONTRAT = ['PERMANENT', 'VACATAIRE', 'ADMINISTRATIF', 'STAGIAIRE']

// ── MODAL ──────────────────────────────────────────
function PersonnelModal({ membre, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!membre

  const [form, setForm] = useState({
    prenom: membre?.utilisateur?.prenom || '',
    nom: membre?.utilisateur?.nom || '',
    email: membre?.utilisateur?.email || '',
    telephone: membre?.utilisateur?.telephone || '',
    typeContrat: membre?.typeContrat || 'PERMANENT',
    poste: membre?.poste || '',
    dateEmbauche: membre?.dateEmbauche?.slice(0, 10) || '',
    salaireBase: membre?.salaireBase || '',
    tauxHoraire: membre?.tauxHoraire || '',
    cin: membre?.cin || '',
    rib: membre?.rib || '',
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: isEdit
      ? (data) => personnelApi.update(membre.id, data)
      : (data) => personnelApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personnel'] })
      toast.success(isEdit ? 'Membre modifié' : 'Membre créé')
      onClose()
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur')
  })

  const handleSubmit = () => {
    if (!form.prenom || !form.nom || !form.poste || !form.dateEmbauche) {
      setError('Prénom, nom, poste et date d\'embauche sont requis')
      return
    }
    if (!isEdit && !form.email) {
      setError('Email requis')
      return
    }
    setError('')
    mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">
            {isEdit ? 'Modifier membre' : 'Nouveau membre du personnel'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *" value={form.prenom} onChange={v => set('prenom', v)} />
            <Field label="Nom *" value={form.nom} onChange={v => set('nom', v)} />
          </div>

          {!isEdit && (
            <Field label="Email *" type="email" value={form.email} onChange={v => set('email', v)} />
          )}

          <Field label="Téléphone" value={form.telephone} onChange={v => set('telephone', v)} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type de contrat *</label>
              <select value={form.typeContrat} onChange={e => set('typeContrat', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                {TYPES_CONTRAT.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Field label="Poste *" value={form.poste} onChange={v => set('poste', v)} />
          </div>

          <Field label="Date d'embauche *" type="date" value={form.dateEmbauche} onChange={v => set('dateEmbauche', v)} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Salaire de base (MAD)" type="number" value={form.salaireBase} onChange={v => set('salaireBase', v)} />
            <Field label="Taux horaire (MAD/h)" type="number" value={form.tauxHoraire} onChange={v => set('tauxHoraire', v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="CIN" value={form.cin} onChange={v => set('cin', v)} />
            <Field label="RIB" value={form.rib} onChange={v => set('rib', v)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {isPending ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
      />
    </div>
  )
}

// ── DETAIL PANEL ───────────────────────────────────
function PersonnelPanel({ membre, onClose, onEdit }) {
  const qc = useQueryClient()
  const [confirm, setConfirm] = useState(false)

  const { data } = useQuery({
    queryKey: ['personnel', membre.id],
    queryFn: () => personnelApi.getById(membre.id)
  })
  const detail = data?.data?.data || membre

  const { mutate: deactivate } = useMutation({
    mutationFn: () => personnelApi.deactivate(membre.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personnel'] })
      toast.success('Membre désactivé')
      onClose()
    }
  })

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col">
      <div className="bg-gradient-to-br from-gray-950 to-blue-950 p-6 text-center relative">
        <button onClick={onClose}
          className="absolute top-3 right-3 text-white/50 hover:text-white text-lg">✕</button>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3">
          {detail.utilisateur?.prenom?.[0]}{detail.utilisateur?.nom?.[0]}
        </div>
        <div className="text-white font-bold text-lg">
          {detail.utilisateur?.prenom} {detail.utilisateur?.nom}
        </div>
        <div className="text-gray-400 text-sm mt-1">{detail.poste}</div>
        <div className="mt-3">
          <Badge label={detail.typeContrat} variant={CONTRAT_COLORS[detail.typeContrat]} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Section title="Contact">
          <Row label="Email" value={detail.utilisateur?.email} />
          <Row label="Téléphone" value={detail.utilisateur?.telephone} />
          <Row label="CIN" value={detail.cin} />
        </Section>

        <Section title="Contrat">
          <Row label="Type" value={detail.typeContrat} />
          <Row label="Date embauche" value={detail.dateEmbauche
            ? new Date(detail.dateEmbauche).toLocaleDateString('fr-FR')
            : '—'} />
          <Row label="Salaire base" value={detail.salaireBase ? `${detail.salaireBase} MAD` : '—'} />
          <Row label="Taux horaire" value={detail.tauxHoraire ? `${detail.tauxHoraire} MAD/h` : '—'} />
          <Row label="RIB" value={detail.rib} />
        </Section>

        {detail.salaires?.length > 0 && (
          <Section title="Derniers salaires">
            {detail.salaires.map(s => (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="text-gray-500">{s.mois}/{s.annee}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{parseFloat(s.montantNet).toLocaleString('fr-FR')} MAD</span>
                  <Badge label={s.statut} variant={s.statut === 'PAYE' ? 'green' : 'amber'} />
                </div>
              </div>
            ))}
          </Section>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 flex gap-2">
        <button onClick={() => onEdit(membre)}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg py-2 transition">
          ✏️ Modifier
        </button>
        <button
          onClick={() => setConfirm(true)}
          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-lg py-2 transition">
          🚫 Désactiver
        </button>
      </div>
      <ConfirmDialog
        isOpen={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => deactivate()}
        title="Désactiver le membre"
        message={`Désactiver ${detail.utilisateur?.prenom} ${detail.utilisateur?.nom} ? Il n'aura plus accès au système.`}
      />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</div>
      <div className="bg-gray-50 rounded-xl p-3 space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800">{value || '—'}</span>
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────
export default function Personnel() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [typeContrat, setTypeContrat] = useState('')

  const [search, setSearch] = useState('')

  // update query
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['personnel', { typeContrat, search, page }],
    queryFn: () => personnelApi.getAll({ typeContrat, search, page, limit: 15 }),
    keepPreviousData: true
  })

  const meta = data?.data?.meta || {}

  const membres = data?.data?.data || []

  const counts = {
    total: membres.length,
    permanent: membres.filter(m => m.typeContrat === 'PERMANENT').length,
    vacataire: membres.filter(m => m.typeContrat === 'VACATAIRE').length,
  }



  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Personnel</h1>
          <p className="text-sm text-gray-500 mt-0.5">{counts.total} membres actifs</p>
        </div>
        <button onClick={() => setModal('create')}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          ➕ Nouveau membre
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        <StatCard icon="👥" bg="bg-blue-50" label="Total" value={counts.total} />
        <StatCard icon="📋" bg="bg-teal-50" label="Permanents" value={counts.permanent} />
        <StatCard icon="🕐" bg="bg-violet-50" label="Vacataires" value={counts.vacataire} />
      </div>

      {/* Filter */}
      <div className="flex gap-2 lg:gap-3 flex-wrap">
        <input
          type="text"
          placeholder="🔍 Nom, poste, email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:border-blue-500 transition"
        />
        <select value={typeContrat}
          onChange={e => { setTypeContrat(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          <option value="">Tous les contrats</option>
          {TYPES_CONTRAT.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Membre</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Poste</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Contrat</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Salaire base</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Statut</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {membres.map(m => (
                <tr key={m.id}
                  onClick={() => setSelected(m)}
                  className="border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {m.utilisateur.prenom[0]}{m.utilisateur.nom[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {m.utilisateur.prenom} {m.utilisateur.nom}
                        </div>
                        <div className="text-xs text-gray-400">{m.utilisateur.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{m.poste}</td>
                  <td className="px-5 py-3.5">
                    <Badge label={m.typeContrat} variant={CONTRAT_COLORS[m.typeContrat]} />
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 font-semibold">
                    {m.salaireBase
                      ? `${parseFloat(m.salaireBase).toLocaleString('fr-FR')} MAD`
                      : m.tauxHoraire ? `${m.tauxHoraire} MAD/h` : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge label={m.isActive ? 'Actif' : 'Inactif'} variant={m.isActive ? 'green' : 'gray'} />
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={e => { e.stopPropagation(); setModal(m) }}
                      className="text-gray-400 hover:text-blue-600 transition">✏️</button>
                  </td>
                </tr>
              ))}
              {!membres.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="text-4xl mb-3">👥</div>
                    <div className="font-semibold text-gray-500">
                      {search || typeContrat ? 'Aucun résultat pour cette recherche' : 'Aucun membre du personnel'}
                    </div>
                    {!search && !typeContrat && (
                      <div className="text-sm text-gray-400 mt-1">Cliquez sur "Nouveau membre" pour commencer</div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

        )}
        {meta.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Page {meta.page} sur {meta.totalPages} · {meta.total} membres
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                ← Préc.
              </button>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                Suiv. →
              </button>
            </div>
          </div>
        )}
      </Card>

      {(modal === 'create' || (modal && modal.id)) && (
        <PersonnelModal
          membre={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}

      {selected && (
        <PersonnelPanel
          membre={selected}
          onClose={() => setSelected(null)}
          onEdit={(m) => { setSelected(null); setModal(m) }}
        />
      )}
    </div>
  )
}