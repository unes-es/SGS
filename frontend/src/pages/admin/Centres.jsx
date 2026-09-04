import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { centresApi } from '../../api/centres'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

// This page is deliberately SUPER_ADMIN-only (see centres.routes.js's
// GET /admin/all) - creating/deactivating a whole campus isn't a DIRECTEUR-
// level action the way editing one's own centre's branding in Parametres
// is. Logo/couleur editing stays in Parametres, scoped to whichever centre
// the switcher has selected - this page is about the list itself:
// creating a new campus, and activating/deactivating an existing one.
export default function Centres() {
  const { user } = useAuthStore()
  const canManage = user?.role === 'SUPER_ADMIN'

  const [editing, setEditing] = useState(null) // null = closed, {} = new, {...} = edit
  const [confirmToggle, setConfirmToggle] = useState(null)

  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['centres-admin'],
    queryFn: () => centresApi.getAllAdmin(),
    enabled: canManage
  })
  const centres = data?.data?.data || []

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['centres-admin'] })
    qc.invalidateQueries({ queryKey: ['centres'] })
  }

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (form) => form.id ? centresApi.update(form.id, form) : centresApi.create(form),
    onSuccess: () => {
      toast.success(editing?.id ? 'Centre mis à jour' : 'Centre créé')
      invalidate()
      setEditing(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur')
  })

  const { mutate: toggleActive } = useMutation({
    // Deactivate goes through DELETE (SUPER_ADMIN-only server-side),
    // reactivate through PUT { isActive: true } - see centresApi.js.
    mutationFn: ({ id, isActive }) => isActive ? centresApi.update(id, { isActive: true }) : centresApi.deactivate(id),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'Centre réactivé' : 'Centre désactivé')
      invalidate()
      setConfirmToggle(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur')
  })

  if (!canManage) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3">
        Réservé au Super Admin.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Centres</h1>
          <p className="text-sm text-gray-500 mt-0.5">Campus gérés par SGS</p>
        </div>
        <button onClick={() => setEditing({})}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition">
          + Nouveau centre
        </button>
      </div>

      <Card>
        {isLoading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Centre</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Ville</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Effectifs</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Statut</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {centres.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {c.logoUrl
                        ? <img src={c.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: c.couleurPrimaire || '#2563eb' }} />}
                      <div>
                        <div className="font-semibold text-gray-900">{c.nom}</div>
                        <div className="text-xs text-gray-400">{c.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{c.ville}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {c._count?.eleves ?? 0} élèves · {c._count?.personnel ?? 0} personnel
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge label={c.isActive ? 'Actif' : 'Désactivé'} variant={c.isActive ? 'green' : 'red'} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditing(c)}
                        className="text-gray-400 hover:text-blue-600 transition text-xs font-semibold">
                        Modifier
                      </button>
                      <button onClick={() => setConfirmToggle(c)}
                        className={`text-xs font-semibold transition ${c.isActive ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-emerald-600'}`}>
                        {c.isActive ? 'Désactiver' : 'Réactiver'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!centres.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="text-4xl mb-3">🏫</div>
                    <div className="font-semibold text-gray-500">Aucun centre</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      <div className="text-xs text-gray-400">
        Logo, couleur et coordonnées complètes se modifient dans{' '}
        <span className="font-semibold text-gray-500">Paramètres</span>, pour le centre actuellement sélectionné.
      </div>

      {editing && (
        <CentreModal
          centre={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          isPending={saving}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => toggleActive({ id: confirmToggle.id, isActive: !confirmToggle.isActive })}
        danger={confirmToggle?.isActive}
        title={confirmToggle?.isActive ? 'Désactiver ce centre' : 'Réactiver ce centre'}
        message={
          confirmToggle?.isActive
            ? `${confirmToggle?.nom} disparaîtra du site public et des listes de sélection. Les données existantes (élèves, personnel...) ne sont pas supprimées.`
            : `${confirmToggle?.nom} redeviendra visible et sélectionnable.`
        }
        confirmLabel="Confirmer"
      />
    </div>
  )
}

const slugify = (s) => s
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents (é -> e, etc.)
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')

function CentreModal({ centre, onClose, onSave, isPending }) {
  const [form, setForm] = useState({
    id: centre.id,
    nom: centre.nom || '',
    slug: centre.slug || '',
    ville: centre.ville || '',
    adresse: centre.adresse || '',
    telephone: centre.telephone || '',
    email: centre.email || '',
  })
  const [slugTouched, setSlugTouched] = useState(!!centre.id)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setNom = (v) => {
    set('nom', v)
    if (!slugTouched) set('slug', slugify(v))
  }
  const valid = form.nom.trim() && form.slug.trim() && form.ville.trim()

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">{centre.id ? 'Modifier le centre' : 'Nouveau centre'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nom *</label>
            <input value={form.nom} onChange={e => setNom(e.target.value)} placeholder="SGS Marrakech"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Slug * <span className="text-gray-400 font-normal">(identifiant unique, généré automatiquement)</span>
            </label>
            <input value={form.slug} onChange={e => { setSlugTouched(true); set('slug', e.target.value) }}
              placeholder="marrakech"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ville *</label>
            <input value={form.ville} onChange={e => set('ville', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Adresse</label>
            <input value={form.adresse} onChange={e => set('adresse', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Téléphone</label>
              <input value={form.telephone} onChange={e => set('telephone', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          {!centre.id && (
            <p className="text-xs text-gray-400">
              Logo et couleur se configurent ensuite dans Paramètres, une fois le centre créé.
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={() => onSave(form)} disabled={isPending || !valid}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
              {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
