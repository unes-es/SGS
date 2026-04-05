import { useState } from 'react'

const FILIERES = [
  { icon:'💻', name:'BTS Développement Informatique', level:'Bac+2 · 2 ans', campus:'Casa & Rabat', price:'3 600', insertion:'97%', students:89, color:'blue',   cat:['bts','tech'],    desc:'Programmation, réseaux, bases de données, développement web et mobile.' },
  { icon:'🌐', name:'BTS Réseaux & Télécoms',         level:'Bac+2 · 2 ans', campus:'Casablanca',  price:'3 800', insertion:'92%', students:44, color:'orange', cat:['bts','tech'],    desc:'Infrastructure réseau, cybersécurité, administration systèmes. Certification Cisco incluse.' },
  { icon:'🛒', name:'BTS Commerce & Marketing',       level:'Bac+2 · 2 ans', campus:'Casa & Rabat', price:'3 000', insertion:'91%', students:57, color:'teal',   cat:['bts','gestion'], desc:'Techniques commerciales, marketing digital, e-commerce, gestion relation client.' },
  { icon:'📊', name:'Licence Gestion des Entreprises',level:'Bac+3 · 3 ans', campus:'Casa & Rabat', price:'3 200', insertion:'93%', students:74, color:'gold',   cat:['licence','gestion'], desc:'Finance, comptabilité, management, droit des affaires. Stages chaque été.' },
  { icon:'⚙️', name:'Licence Mécatronique',           level:'Bac+3 · 3 ans', campus:'Casablanca',  price:'3 800', insertion:'90%', students:38, color:'rose',   cat:['licence','tech'], desc:'Mécanique, électronique, automatisme, robotique industrielle.' },
  { icon:'💼', name:'Licence RH & Management',        level:'Bac+3 · 3 ans', campus:'Rabat · 2026', price:'3 100', insertion:'—',  students:0,  color:'green',  cat:['licence','gestion'], desc:'GRH, droit du travail, recrutement, développement organisationnel. Nouvelle filière 2026.' },
]

const FILTERS = [
  { key: 'all',     label: 'Toutes' },
  { key: 'bts',     label: 'BTS (Bac+2)' },
  { key: 'licence', label: 'Licences (Bac+3)' },
  { key: 'tech',    label: 'Technologie' },
  { key: 'gestion', label: 'Gestion & Commerce' },
]

const COLORS = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-700',   btn: 'bg-blue-600' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-700', btn: 'bg-orange-600' },
  teal:   { bg: 'bg-teal-50',   icon: 'bg-teal-100 text-teal-700',   btn: 'bg-teal-600' },
  gold:   { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-700', btn: 'bg-yellow-500' },
  rose:   { bg: 'bg-rose-50',   icon: 'bg-rose-100 text-rose-700',   btn: 'bg-rose-600' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-700', btn: 'bg-green-600' },
}

export default function Filieres() {
  const [filter, setFilter] = useState('all')

  const visible = FILIERES.filter(f =>
    filter === 'all' || f.cat.includes(filter)
  )

  const scrollToInscr = () =>
    document.querySelector('#preinscription')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="filieres" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">

        <div className="mb-12">
          <div className="flex items-center gap-3 text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">
            <span className="w-5 h-0.5 bg-blue-600 rounded"></span>
            Programmes & Filières
          </div>
          <h2 className="text-4xl font-bold text-gray-900 leading-tight">
            Des formations calibrées<br />
            <span className="italic font-light text-blue-600">pour le marché marocain</span>
          </h2>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-10">
          {FILTERS.map(f => (
            <button key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                filter === f.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map(f => {
            const c = COLORS[f.color]
            return (
              <div key={f.name}
                className="border border-gray-200 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 bg-white group">

                <div className={`p-5 ${c.bg}`}>
                  <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center text-2xl mb-4`}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">{f.name}</h3>
                  <div className="text-gray-500 text-xs">{f.level} · {f.campus}</div>
                </div>

                <div className="p-5">
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{f.desc}</p>

                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                      { val: f.students || 'Bientôt', lbl: 'Étudiants' },
                      { val: f.insertion,              lbl: 'Insertion' },
                      { val: `${f.price} MAD`,         lbl: '/mois' },
                    ].map(s => (
                      <div key={s.lbl} className="text-center bg-gray-50 rounded-lg py-2">
                        <div className="text-sm font-bold text-gray-900">{s.val}</div>
                        <div className="text-xs text-gray-400">{s.lbl}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={scrollToInscr}
                    className={`w-full ${c.btn} hover:opacity-90 text-white text-sm font-bold py-2.5 rounded-xl transition`}>
                    S'inscrire →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}