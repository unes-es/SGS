import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

// public API calls — no auth needed
const publicApi = {
  getCentres:  () => axios.get('/api/centres'),
  getFilieres: (centreId) => axios.get('/api/filieres', { params: { centreId } }),
}

export default function Preinscription() {
  const [form, setForm] = useState({
    prenom:'', nom:'', email:'', telephone:'',
    centreId:'', filiereId:'', niveau:''
  })
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  const { data: centresRes } = useQuery({
    queryKey: ['public-centres'],
    queryFn:  publicApi.getCentres
  })

  const { data: filieresRes } = useQuery({
    queryKey: ['public-filieres', form.centreId],
    queryFn:  () => publicApi.getFilieres(form.centreId),
    enabled:  !!form.centreId
  })

  const centres  = centresRes?.data?.data  || []
  const filieres = filieresRes?.data?.data || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.prenom || !form.email || !form.centreId || !form.filiereId) {
      setError('Merci de remplir tous les champs obligatoires (*)')
      return
    }
    setError('')
    setLoading(true)
    try {
      await axios.post('/api/candidatures/public', {
        prenom:    form.prenom,
        nom:       form.nom,
        email:     form.email,
        telephone: form.telephone,
        centreId:  form.centreId,
        filiereId: form.filiereId,
      })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue, veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="preinscription"
      className="py-24 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d2d2d 100%)' }}>

      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — unchanged */}
          <div>
            <div className="flex items-center gap-3 text-yellow-400 text-xs font-bold uppercase tracking-widest mb-4">
              <span className="w-5 h-0.5 bg-yellow-400 rounded"></span>
              Candidature en ligne
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Postulez en<br />
              <span className="italic font-light text-yellow-400">3 étapes simples</span>
            </h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Remplissez le formulaire, et recevez une réponse sous 48h.
            </p>
            <div className="space-y-5">
              {[
                { n:'1', title:'Remplissez le formulaire', sub:'Vos informations personnelles et votre choix de filière' },
                { n:'2', title:'Joignez vos documents',    sub:'Relevés de notes, carte d\'identité, photo' },
                { n:'3', title:'Recevez votre confirmation', sub:'Réponse par email et SMS sous 48 heures' },
              ].map(s => (
                <div key={s.n} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {s.n}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{s.title}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 bg-yellow-500/10 border border-yellow-500/25 rounded-xl px-5 py-4">
              <div className="text-yellow-400 font-bold text-sm mb-1">⚡ Places limitées — Rentrée septembre 2026</div>
              <div className="text-gray-500 text-xs">Les dossiers sont traités par ordre d'arrivée</div>
            </div>
          </div>

          {/* Right — Form */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            {sent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Candidature envoyée !</h3>
                <p className="text-gray-500 text-sm">
                  Merci <strong>{form.prenom}</strong> ! Nous vous contacterons sous 48h à <strong>{form.email}</strong>.
                </p>
                <div className="mt-4 bg-teal-50 border border-teal-100 text-teal-700 text-xs rounded-lg px-4 py-3">
                  📱 Une confirmation SMS vous sera également envoyée
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Formulaire de candidature</h3>
                  <p className="text-gray-400 text-sm">Réponse sous 48h · Tous les * sont requis</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <FI label="Prénom *" value={form.prenom}    onChange={v => set('prenom', v)} />
                  <FI label="Nom *"    value={form.nom}       onChange={v => set('nom', v)} />
                </div>
                <FI label="Email *"    value={form.email}     onChange={v => set('email', v)}     type="email" />
                <FI label="Téléphone"  value={form.telephone} onChange={v => set('telephone', v)} type="tel" />

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Centre souhaité *</label>
                  <select value={form.centreId} onChange={e => { set('centreId', e.target.value); set('filiereId', '') }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="">Choisir un centre</option>
                    {centres.map(c => (
                      <option key={c.id} value={c.id}>{c.nom} — {c.ville}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Filière souhaitée *</label>
                  <select value={form.filiereId} onChange={e => set('filiereId', e.target.value)}
                    disabled={!form.centreId}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50">
                    <option value="">{form.centreId ? 'Choisir une filière' : 'Sélectionnez un centre d\'abord'}</option>
                    {filieres.map(f => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Niveau actuel</label>
                  <select value={form.niveau} onChange={e => set('niveau', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="">Votre diplôme le plus élevé</option>
                    <option>Baccalauréat (en cours)</option>
                    <option>Baccalauréat obtenu</option>
                    <option>BTS en cours</option>
                    <option>BTS obtenu</option>
                    <option>Autre</option>
                  </select>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition">
                  {loading ? 'Envoi en cours...' : '✉️ Envoyer ma candidature'}
                </button>
                <p className="text-center text-xs text-gray-400">
                  🔒 Vos données sont confidentielles · Réponse sous 48h
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function FI({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
    </div>
  )
}