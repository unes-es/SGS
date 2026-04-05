const TEMOIGNAGES = [
  { initials:'YA', name:'Yasmine Alaoui',  meta:'Promo 2024 · Développeuse chez Intelcia', color:'from-blue-500 to-violet-600',
    stars:5, text:'La formation BTS Informatique m\'a donné toutes les bases pour décrocher mon CDI dès la sortie. Les professeurs sont vraiment impliqués et les TP très pratiques.' },
  { initials:'OR', name:'Omar Rachidi',    meta:'Promo 2023 · Analyste financier, Attijariwafa Bank', color:'from-amber-500 to-orange-600',
    stars:5, text:'La Licence Gestion m\'a ouvert les portes du secteur bancaire. Le réseau de l\'école et les stages en entreprise font vraiment la différence.' },
  { initials:'FE', name:'Fatima Ezzahra', meta:'Promo 2025 · Chargée RH, OCP Group', color:'from-rose-500 to-pink-600',
    stars:4, text:'Le centre de Rabat est très bien équipé. J\'ai apprécié la proximité des professeurs et la flexibilité des horaires pour concilier études et vie personnelle.' },
]

export default function Temoignages() {
  return (
    <section id="temoignages" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-14">
          <div className="flex items-center gap-3 text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">
            <span className="w-5 h-0.5 bg-blue-600 rounded"></span>
            Témoignages
          </div>
          <h2 className="text-4xl font-bold text-gray-900">
            Ce que disent nos <span className="italic font-light text-blue-600">diplômés</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TEMOIGNAGES.map(t => (
            <div key={t.name} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="text-yellow-400 text-sm tracking-widest mb-4">
                {'★'.repeat(t.stars)}{'☆'.repeat(5-t.stars)}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed italic mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{t.meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}