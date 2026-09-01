import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { centresApi } from '../../api/centres'
import { useAuthStore } from '../../store/authStore'
import { useCentreStore } from '../../store/centreStore'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'

const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_LOGO_SIZE = 2 * 1024 * 1024

export default function Parametres() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const { selectedCentreId } = useCentreStore()
  // Same fallback every other page uses: whichever centre a SUPER_ADMIN
  // has picked in the Topbar switcher, otherwise the admin's own centre -
  // DIRECTEUR/other roles only ever have their own to begin with.
  const centreId = selectedCentreId || user?.centreId

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'DIRECTEUR'

  const { data, isLoading } = useQuery({
    queryKey: ['centre', centreId],
    queryFn: () => centresApi.getById(centreId),
    enabled: !!centreId
  })
  const centre = data?.data?.data

  const [form, setForm] = useState(null)
  const [logoError, setLogoError] = useState('')
  // Tracks which centre `form` was last seeded from, so it can be re-seeded
  // (during render, not as a useEffect side-effect - the pattern React
  // itself recommends for "adjust state when a prop/query result changes")
  // whenever the loaded centre changes: the initial load, or switching
  // centres via the Topbar while this page is already open.
  const [seededCentreId, setSeededCentreId] = useState(null)

  if (centre && centre.id !== seededCentreId) {
    setSeededCentreId(centre.id)
    setForm({
      nom: centre.nom || '',
      adresse: centre.adresse || '',
      ville: centre.ville || '',
      telephone: centre.telephone || '',
      email: centre.email || '',
      couleurPrimaire: centre.couleurPrimaire || '#2563eb',
    })
  }

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (data) => centresApi.update(centreId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['centre', centreId] })
      qc.invalidateQueries({ queryKey: ['centres-all'] })
      toast.success('Paramètres enregistrés')
    }
  })

  const { mutate: uploadLogo, isPending: uploadingLogo } = useMutation({
    mutationFn: (file) => centresApi.updateLogo(centreId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['centre', centreId] })
      toast.success('Logo mis à jour')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi du logo')
  })

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    setLogoError('')
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoError('Format non supporté (PNG, JPEG ou WEBP uniquement)')
      return
    }
    if (file.size > MAX_LOGO_SIZE) {
      setLogoError('Fichier trop volumineux (2 Mo maximum)')
      return
    }
    uploadLogo(file)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    save(form)
  }

  if (!canEdit) {
    return (
      <Card>
        <div className="p-8 text-center text-gray-500">
          <div className="text-3xl mb-2">🔒</div>
          <p className="text-sm">Réservé aux directeurs et super-administrateurs.</p>
        </div>
      </Card>
    )
  }

  if (isLoading || !form) return <Spinner />

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Logo, couleur et informations du centre — utilisés sur tous les documents PDF générés pour ce centre.
        </p>
      </div>

      <Card>
        <div className="p-6 space-y-5">
          {/* Logo */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Logo du centre</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {centre?.logoUrl ? (
                  <img src={centre.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl">🏫</span>
                )}
              </div>
              <div className="flex-1">
                <label className="inline-block cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-2 transition">
                  {uploadingLogo ? 'Envoi...' : 'Changer le logo'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                    disabled={uploadingLogo} onChange={handleLogoChange} />
                </label>
                <p className="mt-1 text-xs text-gray-400">PNG, JPEG ou WEBP, 2 Mo maximum. Apparaît en haut à droite de chaque document PDF.</p>
                {logoError && <p className="mt-1 text-xs text-red-500">{logoError}</p>}
              </div>
            </div>
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Couleur principale</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.couleurPrimaire}
                onChange={e => set('couleurPrimaire', e.target.value)}
                className="w-11 h-11 rounded-lg border border-gray-200 cursor-pointer" />
              <input type="text" value={form.couleurPrimaire}
                onChange={e => set('couleurPrimaire', e.target.value)}
                className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500" />
              <span className="text-xs text-gray-400">En-tête et accents des documents PDF</span>
            </div>
          </div>

          {/* Infos centre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nom du centre</label>
              <input type="text" value={form.nom} onChange={e => set('nom', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Adresse</label>
              <input type="text" value={form.adresse} onChange={e => set('adresse', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ville</label>
              <input type="text" value={form.ville} onChange={e => set('ville', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Téléphone</label>
              <input type="text" value={form.telephone} onChange={e => set('telephone', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="pt-2">
            <button onClick={handleSubmit} disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
