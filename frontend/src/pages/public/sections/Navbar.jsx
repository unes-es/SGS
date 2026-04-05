import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const LINKS = [
  { label: 'Nos centres',  href: '#centres' },
  { label: 'Programmes',   href: '#filieres' },
  { label: 'Actualités',   href: '#actualites' },
  { label: 'Événements',   href: '#evenements' },
  { label: 'Localisation', href: '#localisation' },
  { label: 'Contact',      href: '#contact' },
]

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [showInscr,   setShowInscr]   = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (href) => {
    setMenuOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center text-lg">
              🎓
            </div>
            <div>
              <div className={`font-bold text-base leading-none transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                SGS
              </div>
              <div className={`text-xs transition-colors ${scrolled ? 'text-gray-400' : 'text-white/50'}`}>
                ÉCOLE SUPÉRIEURE
              </div>
            </div>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1 ml-auto">
            {LINKS.map(l => (
              <button key={l.href}
                onClick={() => scrollTo(l.href)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  scrolled
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}>
                {l.label}
              </button>
            ))}
            <button
              onClick={() => setShowInscr(true)}
              className="ml-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-sm font-bold px-4 py-2 rounded-lg transition-all">
              ✏️ S'inscrire
            </button>
            <Link to="/admin/login"
              className={`ml-1 text-sm font-medium px-3 py-2 rounded-lg transition-all ${
                scrolled ? 'text-gray-500 hover:text-gray-700' : 'text-white/60 hover:text-white'
              }`}>
              Connexion →
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden ml-auto flex flex-col gap-1.5 p-2">
            <span className={`w-5 h-0.5 transition-all ${scrolled ? 'bg-gray-800' : 'bg-white'} ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-5 h-0.5 transition-all ${scrolled ? 'bg-gray-800' : 'bg-white'} ${menuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-5 h-0.5 transition-all ${scrolled ? 'bg-gray-800' : 'bg-white'} ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-gray-950 border-t border-gray-800 px-6 py-4 flex flex-col gap-1">
            {LINKS.map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href)}
                className="text-left text-gray-300 hover:text-white py-2.5 text-sm font-medium border-b border-gray-800 last:border-0">
                {l.label}
              </button>
            ))}
            <button onClick={() => { setMenuOpen(false); setShowInscr(true) }}
              className="mt-3 bg-yellow-500 text-gray-900 font-bold py-2.5 rounded-lg text-sm">
              ✏️ S'inscrire maintenant
            </button>
          </div>
        )}
      </nav>

      {/* Inscription modal */}
      {showInscr && <InscriptionModal onClose={() => setShowInscr(false)} />}
    </>
  )
}

function InscriptionModal({ onClose }) {
  const [form, setForm]   = useState({ prenom:'', nom:'', email:'', telephone:'', centre:'SGS Casablanca', filiere:'' })
  const [sent, setSent]   = useState(false)
  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.prenom || !form.email || !form.filiere) return
    setSent(true)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="font-bold text-gray-900">✏️ Formulaire de candidature</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <div className="text-lg font-bold text-gray-900 mb-2">Candidature envoyée !</div>
            <div className="text-sm text-gray-500">
              Merci <strong>{form.prenom}</strong> ! Nous vous contacterons sous 48h.
            </div>
            <button onClick={onClose}
              className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold">
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FI label="Prénom *"    value={form.prenom}    onChange={v => set('prenom',v)} />
              <FI label="Nom *"       value={form.nom}       onChange={v => set('nom',v)} />
            </div>
            <FI label="Email *"       value={form.email}     onChange={v => set('email',v)}     type="email" />
            <FI label="Téléphone"     value={form.telephone} onChange={v => set('telephone',v)} />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Centre *</label>
              <select value={form.centre} onChange={e => set('centre',e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option>SGS Casablanca</option>
                <option>SGS Rabat</option>
                <option>Indifférent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Filière *</label>
              <select value={form.filiere} onChange={e => set('filiere',e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option value="">Choisir une filière</option>
                <option>BTS Développement Informatique</option>
                <option>BTS Réseaux & Télécoms</option>
                <option>BTS Commerce & Marketing</option>
                <option>Licence Gestion des Entreprises</option>
                <option>Licence Mécatronique</option>
                <option>Licence RH & Management (2026)</option>
              </select>
            </div>
            <button type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm transition">
              ✉️ Envoyer ma candidature
            </button>
            <p className="text-center text-xs text-gray-400">🔒 Réponse sous 48h · Données confidentielles</p>
          </form>
        )}
      </div>
    </div>
  )
}

function FI({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
    </div>
  )
}