const EVENTS = [
  { day:'15', mon:'AVR', type:'PORTES OUVERTES', typeColor:'text-blue-600', bg:'bg-blue-50', title:'Journée portes ouvertes — Campus Casa', desc:'Venez visiter nos installations, rencontrer les professeurs. Sessions toutes les heures.', lieu:'📍 Casa · 09h–17h', btnColor:'bg-blue-600' },
  { day:'22', mon:'AVR', type:'TEST ADMISSION',  typeColor:'text-yellow-600', bg:'bg-yellow-50', title:'Session test d\'admission — Rentrée 2026', desc:'Tests de culture générale, mathématiques et logique. Disponible à Casa et Rabat simultanément.', lieu:'📍 Casa & Rabat · 09h–11h', btnColor:'bg-yellow-500' },
  { day:'10', mon:'MAI', type:'FORUM EMPLOI',    typeColor:'text-teal-600', bg:'bg-teal-50', title:'Forum emploi & stage 2026', desc:'40+ entreprises recrutent directement nos étudiants et diplômés. Ateliers CV, entretiens flash.', lieu:'📍 Casa · 10h–18h · Gratuit', btnColor:'bg-teal-600' },
]

export default function Evenements() {
  const scrollToInscr = () =>
    document.querySelector('#preinscription')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="evenements" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between mb-14 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">
              <span className="w-5 h-0.5 bg-blue-600 rounded"></span>
              Agenda
            </div>
            <h2 className="text-4xl font-bold text-gray-900">
              Événements à <span className="italic font-light text-blue-600">venir</span>
            </h2>
          </div>
          <button className="border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition">
            Voir l'agenda complet →
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {EVENTS.map(e => (
            <div key={e.title} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="p-5 flex items-center gap-4">
                <div className={`w-14 h-14 ${e.bg} rounded-xl flex flex-col items-center justify-center flex-shrink-0`}>
                  <div className={`text-2xl font-black leading-none ${e.typeColor}`}>{e.day}</div>
                  <div className={`text-xs font-bold ${e.typeColor}`}>{e.mon}</div>
                </div>
                <div>
                  <div className={`text-xs font-bold uppercase tracking-wide ${e.typeColor} mb-1`}>{e.type}</div>
                  <div className="font-bold text-gray-900 text-sm leading-snug">{e.title}</div>
                </div>
              </div>
              <div className="px-5 pb-4 text-gray-500 text-sm leading-relaxed">{e.desc}</div>
              <div className="px-5 pb-5 flex items-center justify-between">
                <span className="text-xs text-gray-400">{e.lieu}</span>
                <button onClick={scrollToInscr}
                  className={`${e.btnColor} hover:opacity-90 text-white text-xs font-bold px-4 py-2 rounded-lg transition`}>
                  S'inscrire
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}