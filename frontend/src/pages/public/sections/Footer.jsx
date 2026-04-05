import { Link } from 'react-router-dom'

export default function Footer() {
  const scrollTo = (id) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center text-lg">🎓</div>
              <span className="text-white font-bold text-base">SGS</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              École Supérieure de Gestion et Sciences. Formations BTS et Licences professionnelles à Casablanca et Rabat depuis 2018.
            </p>
            <div className="flex gap-2">
              {['📘','📷','💼','🐦'].map(s => (
                <button key={s}
                  className="w-9 h-9 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg flex items-center justify-center text-sm transition">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Programmes */}
          <div>
            <div className="text-white text-xs font-bold uppercase tracking-widest mb-4">Programmes</div>
            {['BTS Informatique','BTS Réseaux','BTS Commerce','Licence Gestion','Licence Mécatronique','Licence RH (2026)'].map(l => (
              <button key={l} onClick={() => scrollTo('#filieres')}
                className="block text-sm hover:text-white transition mb-2.5">{l}</button>
            ))}
          </div>

          {/* Centres */}
          <div>
            <div className="text-white text-xs font-bold uppercase tracking-widest mb-4">Centres</div>
            {['SGS Casablanca','SGS Rabat','Agenda & événements','Forum emploi','Espace diplômés'].map(l => (
              <button key={l} onClick={() => scrollTo('#centres')}
                className="block text-sm hover:text-white transition mb-2.5">{l}</button>
            ))}
          </div>

          {/* Infos */}
          <div>
            <div className="text-white text-xs font-bold uppercase tracking-widest mb-4">Informations</div>
            {['Pourquoi SGS ?','Vie étudiante','Partenaires','Mentions légales'].map(l => (
              <button key={l} className="block text-sm hover:text-white transition mb-2.5">{l}</button>
            ))}
            <button onClick={() => scrollTo('#preinscription')}
              className="block text-yellow-400 font-semibold text-sm hover:text-yellow-300 transition mb-2.5">
              S'inscrire →
            </button>
            <Link to="/admin/login" className="block text-sm hover:text-white transition">
              Connexion admin
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <span>© 2026 SGS — École Supérieure de Gestion et Sciences. Tous droits réservés.</span>
          <span>Casablanca · Rabat · Maroc</span>
        </div>
      </div>
    </footer>
  )
}