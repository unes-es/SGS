import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { elevesApi } from '../../api/eleves'
import { classesApi } from '../../api/classes'
import { useAuthStore } from '../../store/authStore'
import { useCentreStore } from '../../store/centreStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { toast } from 'sonner'

const STATUT_COLORS = {
  ACTIF: 'green',
  SUSPENDU: 'amber',
  DIPLOME: 'blue',
  ABANDONNE: 'gray',
  RADIE: 'red',
}

// ── MODAL ──────────────────────────────────────────
function EleveModal({ eleve, onClose, centreId }) {
  const qc = useQueryClient()
  const isEdit = !!eleve

  const [form, setForm] = useState({
    prenom: eleve?.utilisateur?.prenom || '',
    nom: eleve?.utilisateur?.nom || '',
    email: eleve?.utilisateur?.email || '',
    telephone: eleve?.utilisateur?.telephone || '',
    dateNaissance: eleve?.dateNaissance?.slice(0, 10) || '',
    classeId: eleve?.classeId || '',
    cin: eleve?.cin || '',
    nomParent: eleve?.nomParent || '',
    telParent: eleve?.telParent || '',
    centreId,
  })
  const [error, setError] = useState('')

  const { data: classesRes } = useQuery({
    queryKey: ['classes', centreId],
    queryFn: () => classesApi.getAll({ centreId })
  })
  const classes = classesRes?.data?.data || []

  const { mutate, isPending } = useMutation({
    mutationFn: isEdit
      ? (data) => elevesApi.update(eleve.id, data)
      : (data) => elevesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eleves'] })
      toast.success(isEdit ? 'Élève modifié' : 'Élève créé')
      onClose()
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur')
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Modifier élève' : 'Nouvel élève'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <Field label="Téléphone" value={form.telephone} onChange={v => set('telephone', v)} />
            <Field label="Date de naissance *" type="date" value={form.dateNaissance} onChange={v => set('dateNaissance', v)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Classe *</label>
            <select
              value={form.classeId}
              onChange={e => set('classeId', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Choisir une classe</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.nom} — {c.filiere?.nom}</option>
              ))}
            </select>
          </div>

          <Field label="CIN" value={form.cin} onChange={v => set('cin', v)} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom du parent" value={form.nomParent} onChange={v => set('nomParent', v)} />
            <Field label="Tél. parent" value={form.telParent} onChange={v => set('telParent', v)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition">
              Annuler
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {isPending ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
      />
    </div>
  )
}

// ── SLIDE PANEL ────────────────────────────────────
function ElevePanel({ eleve, onClose, onEdit }) {
  const qc = useQueryClient()
  const [showLierParent, setShowLierParent] = useState(false)

  const { mutate: changeStatut } = useMutation({
    mutationFn: (statut) => elevesApi.updateStatut(eleve.id, statut),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eleves'] })
      toast.success('Statut mis à jour')
    }
  })

  // Parent portal (feature addition) - the list row (`eleve` prop, from
  // elevesApi.getAll) doesn't include the `parent` relation, only
  // getById does. Refetched here rather than widening getAll's include
  // for every row just to show this in one detail panel.
  const { data: detailRes } = useQuery({
    queryKey: ['eleve-detail', eleve?.id],
    queryFn: () => elevesApi.getById(eleve.id),
    enabled: !!eleve
  })
  const parent = detailRes?.data?.data?.parent

  const { mutate: unlinkParent, isPending: unlinking } = useMutation({
    mutationFn: () => elevesApi.unlinkParent(eleve.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eleve-detail', eleve.id] })
      toast.success('Parent délié')
    }
  })

  if (!eleve) return null

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-950 to-blue-950 p-6 text-center">
        <button onClick={onClose} className="absolute top-3 right-3 text-white/50 hover:text-white text-lg">✕</button>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3">
          {eleve.utilisateur.prenom[0]}{eleve.utilisateur.nom[0]}
        </div>
        <div className="text-white font-bold text-lg">
          {eleve.utilisateur.prenom} {eleve.utilisateur.nom}
        </div>
        <div className="text-gray-400 text-xs mt-1">{eleve.matricule}</div>
        <div className="flex gap-2 justify-center mt-3 flex-wrap">
          <Badge label={eleve.statut} variant={STATUT_COLORS[eleve.statut]} />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Section title="Infos scolaires">
          <Row label="Filière" value={eleve.classe?.filiere?.nom} />
          <Row label="Classe" value={eleve.classe?.nom} />
          <Row label="Matricule" value={eleve.matricule} mono />
        </Section>

        <Section title="Contact">
          <Row label="Email" value={eleve.utilisateur.email} />
          <Row label="Tél." value={eleve.utilisateur.telephone} />
          <Row label="Parent" value={eleve.nomParent} />
          <Row label="Tél. parent" value={eleve.telParent} />
        </Section>

        <Section title="Compte parent">
          {parent ? (
            <>
              <Row label="Nom" value={`${parent.prenom} ${parent.nom}`} />
              <Row label="Email" value={parent.email} />
              <button
                onClick={() => unlinkParent()}
                disabled={unlinking}
                className="mt-2 text-xs text-red-500 hover:underline disabled:opacity-50"
              >
                Délier ce compte parent
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLierParent(true)}
              className="text-xs text-blue-600 hover:underline"
            >
              + Lier un compte parent
            </button>
          )}
        </Section>

        <Section title="Changer le statut">
          <div className="flex flex-wrap gap-1.5">
            {['ACTIF', 'SUSPENDU', 'DIPLOME', 'ABANDONNE', 'RADIE'].map(s => (
              <button key={s}
                onClick={() => changeStatut(s)}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition
                  ${eleve.statut === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600'
                  }`}>
                {s}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100 flex gap-2">
        <button onClick={() => onEdit(eleve)}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg py-2 transition">
          ✏️ Modifier
        </button>
        <button
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg py-2 transition">
          📄 Documents
        </button>
      </div>

      {showLierParent && (
        <LierParentModal
          eleveId={eleve.id}
          onClose={() => setShowLierParent(false)}
        />
      )}
    </div>
  )
}

// Parent portal (feature addition) - links an existing PARENT account
// (matched by email) or creates a new one. Deliberately a separate
// small modal, not folded into EleveModal above - this is a
// post-enrollment action on an existing élève, not part of the
// create/edit form.
function LierParentModal({ eleveId, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ email: '', prenom: '', nom: '', telephone: '' })
  const [error, setError] = useState('')

  const { mutate: link, isPending } = useMutation({
    mutationFn: () => elevesApi.linkParent(eleveId, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eleve-detail', eleveId] })
      toast.success('Compte parent lié')
      onClose()
    },
    onError: (err) => setError(err.response?.data?.message || 'Erreur')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.prenom || !form.nom) {
      setError('Email, prénom et nom sont requis')
      return
    }
    link()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Lier un compte parent</h2>
        <p className="text-xs text-gray-500 mb-4">
          Si un compte parent existe déjà avec cet email, il sera simplement lié à cet élève.
          Sinon, un nouveau compte sera créé et un email de bienvenue sera envoyé.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Email du parent" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
          <Field label="Prénom" value={form.prenom} onChange={v => setForm(f => ({ ...f, prenom: v }))} />
          <Field label="Nom" value={form.nom} onChange={v => setForm(f => ({ ...f, nom: v }))} />
          <Field label="Téléphone (optionnel)" value={form.telephone} onChange={v => setForm(f => ({ ...f, telephone: v }))} />

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg py-2.5 transition">
              Annuler
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2.5 transition">
              {isPending ? 'Liaison...' : 'Lier'}
            </button>
          </div>
        </form>
      </div>
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

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold text-gray-800 ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </span>
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────
// Bulk import (feature addition) - a single file input + submit, then a
// per-row success/failure report. Deliberately no client-side template
// generator: the expected columns are just documented in the modal copy
// (case/accent-insensitive matching is done server-side - see
// eleves.service.js importFromRows()), so any spreadsheet with roughly
// the right headers works rather than requiring an exact downloaded
// template.
function ImportElevesModal({ onClose, onDone }) {
  const [file, setFile] = useState(null)
  const [report, setReport] = useState(null)

  const { mutate: doImport, isPending } = useMutation({
    mutationFn: () => elevesApi.import(file),
    onSuccess: (res) => {
      setReport(res.data.data)
      onDone()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur lors de l\'import')
  })

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Importer des élèves (Excel)</h2>

        {!report ? (
          <>
            <p className="text-xs text-gray-500 mb-4">
              Fichier .xlsx avec une ligne d'en-tête et les colonnes :
              <br />
              <span className="font-mono text-[11px]">Prenom, Nom, Email, DateNaissance, Classe</span> (requis),
              <br />
              <span className="font-mono text-[11px]">Telephone, CIN, Adresse, NomParent, TelParent</span> (optionnels).
              <br />
              La colonne <strong>Classe</strong> doit correspondre exactement au nom d'une classe existante dans ce centre.
            </p>

            <input
              type="file"
              accept=".xlsx"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 mb-4"
            />

            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg py-2.5 transition">
                Annuler
              </button>
              <button
                onClick={() => doImport()}
                disabled={!file || isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2.5 transition">
                {isPending ? 'Import en cours...' : 'Importer'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">
              <strong className="text-green-600">{report.imported}</strong> importé(s) sur {report.total},{' '}
              <strong className={report.failed > 0 ? 'text-red-500' : 'text-gray-400'}>{report.failed}</strong> échec(s).
            </p>
            <div className="space-y-1.5 mb-4">
              {report.results.map(r => (
                <div key={r.row} className={`text-xs px-3 py-2 rounded-lg ${r.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  Ligne {r.row} — {r.success ? `✓ ${r.email} (${r.matricule})` : `✗ ${r.error}`}
                </div>
              ))}
            </div>
            <button onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg py-2.5 transition">
              Fermer
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function Eleves() {
  const { user } = useAuthStore?.() || {}
  const { selectedCentreId } = useCentreStore()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // null | 'create' | eleve object
  const [selected, setSelected] = useState(null)
  const [classeId, setClasseId] = useState('')
  const [showImport, setShowImport] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['eleves', { search, statut, classeId, page, selectedCentreId }],
    queryFn: () => elevesApi.getAll({ search, statut, classeId, page, limit: 15, centreId: selectedCentreId || undefined }),
    keepPreviousData: true
  })

  const [printing, setPrinting] = useState(false)

  const { data: allElevesRes, refetch: fetchAll } = useQuery({
    queryFn: () => elevesApi.getAll({ search, statut, classeId, limit: 500, centreId: selectedCentreId || undefined }),
    queryKey: ['eleves-all-print', { search, statut, classeId, selectedCentreId }],
    enabled: false
  })
  const allEleves = allElevesRes?.data?.data || []

  const handlePrint = async () => {
    setPrinting(true)
    await fetchAll()
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 300)
  }

  // Falls back to the admin's own centre when nothing is explicitly
  // selected - both for filtering this page's Classe dropdown and as the
  // default centreId a newly-created élève is assigned to below.
  const centreId = selectedCentreId || user?.centreId

  const { data: classesRes } = useQuery({
    queryKey: ['classes', centreId],
    queryFn: () => classesApi.getAll({ centreId })
  })


  const classes = classesRes?.data?.data || []

  const eleves = data?.data?.data || []
  const meta = data?.data?.meta || {}

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Élèves</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.total || 0} élèves au total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            disabled={printing}
            className="no-print border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-40">
            {printing ? '...' : '🖨️ Imprimer'}
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="no-print border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition">
            📥 Importer
          </button>
          <button
            onClick={() => setModal('create')}
            className="no-print bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
            ➕ Nouvel élève
          </button>
        </div>
      </div>

      {showImport && (
        <ImportElevesModal
          onClose={() => setShowImport(false)}
          onDone={() => qc.invalidateQueries({ queryKey: ['eleves'] })}
        />
      )}

      {/* Filters */}
      <div className="flex gap-2 lg:gap-3 flex-wrap">
        <input
          type="text"
          placeholder="🔍 Nom, matricule, email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:border-blue-500 transition"
        />
        <select
          value={statut}
          onChange={e => { setStatut(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
        >
          <option value="">Tous les statuts</option>
          <option value="ACTIF">Actif</option>
          <option value="SUSPENDU">Suspendu</option>
          <option value="DIPLOME">Diplômé</option>
          <option value="ABANDONNE">Abandonné</option>
          <option value="RADIE">Radié</option>
        </select>
        <select
          value={classeId}
          onChange={e => { setClasseId(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
        >
          <option value="">Toutes les classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? <Spinner /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Élève</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Matricule</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Classe</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Statut</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {eleves.map(e => (
                  <tr
                    key={e.id}
                    onClick={() => setSelected(e)}
                    className="border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {e.utilisateur.prenom[0]}{e.utilisateur.nom[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {e.utilisateur.prenom} {e.utilisateur.nom}
                          </div>
                          <div className="text-xs text-gray-400">{e.utilisateur.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{e.matricule}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-gray-700">{e.classe?.nom}</div>
                      <div className="text-xs text-gray-400">{e.classe?.filiere?.nom}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={e.statut} variant={STATUT_COLORS[e.statut]} />
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={ev => { ev.stopPropagation(); setModal(e) }}
                        className="text-gray-400 hover:text-blue-600 text-xs font-semibold transition">
                        ✏️
                      </button>
                    </td>
                  </tr>
                ))}
                {!eleves.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                      Aucun élève trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="no-print px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Page {meta.page} sur {meta.totalPages} · {meta.total} résultats
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                    ← Préc.
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages}
                    className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                    Suiv. →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </Card>
      {/* Print view — hidden on screen, shown on print */}
      <div className="print-area hidden print:block">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Liste des élèves</h2>
          <p className="text-sm text-gray-500 mt-1">
            {classeId && `Classe: ${classes.find(c => c.id === classeId)?.nom} · `}
            {search && `Recherche: "${search}" · `}
            {statut && `Statut: ${statut} · `}
            {allEleves.length} élèves · Imprimé le {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 pr-4 text-xs font-bold text-gray-600 uppercase">#</th>
              <th className="text-left py-2 pr-4 text-xs font-bold text-gray-600 uppercase">Nom et prénom</th>
              <th className="text-left py-2 pr-4 text-xs font-bold text-gray-600 uppercase">Matricule</th>
              <th className="text-left py-2 pr-4 text-xs font-bold text-gray-600 uppercase">Classe</th>
              <th className="text-left py-2 pr-4 text-xs font-bold text-gray-600 uppercase">Filière</th>
              <th className="text-left py-2 text-xs font-bold text-gray-600 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody>
            {allEleves.map((e, i) => (
              <tr key={e.id} className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-400 text-xs">{i + 1}</td>
                <td className="py-2 pr-4 font-semibold text-gray-900">
                  {e.utilisateur.prenom} {e.utilisateur.nom}
                </td>
                <td className="py-2 pr-4 font-mono text-xs text-gray-500">{e.matricule}</td>
                <td className="py-2 pr-4 text-gray-700">{e.classe?.nom}</td>
                <td className="py-2 pr-4 text-gray-500 text-xs">{e.classe?.filiere?.nom}</td>
                <td className="py-2 text-xs font-semibold text-gray-700">{e.statut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modals */}
      {(modal === 'create' || (modal && modal.id)) && (
        <EleveModal
          eleve={modal === 'create' ? null : modal}
          centreId={centreId}
          onClose={() => setModal(null)}
        />
      )}

      {/* Slide panel */}
      {selected && (
        <ElevePanel
          eleve={selected}
          onClose={() => setSelected(null)}
          onEdit={(e) => { setSelected(null); setModal(e) }}
        />
      )}
    </div>
  )
}