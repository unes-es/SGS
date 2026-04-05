const ARTICLES = [
  { cat:'Événement', date:'15 Mars 2026', title:'Cérémonie de remise des diplômes — 94 lauréats de la Promo 2025', excerpt:'Une soirée inoubliable pour les 94 diplômés. Retrouvez les temps forts de cette cérémonie au siège de Casablanca.', bg:'from-blue-950 to-teal-950', featured:true },
  { cat:'Partenariat', date:'8 Mars 2026', title:'Nouveau partenariat avec Orange Maroc', excerpt:'Offres de stage et d\'emploi prioritaires pour nos diplômés BTS Réseaux.', bg:'from-violet-950 to-rose-950' },
  { cat:'Formation', date:'1 Mars 2026', title:'Nouvelle filière RH ouvre à Rabat', excerpt:'La Licence RH & Management sera lancée à la rentrée 2026.', bg:'from-emerald-950 to-teal-950' },
  { cat:'Résultats', date:'20 Fév. 2026', title:'Taux d\'insertion 2025 : 94%', excerpt:'Nos diplômés trouvent un emploi en moins de 6 mois.', bg:'from-orange-950 to-amber-950' },
]

export default function Actualites() {
  return (
    <section id="actualites" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between mb-14 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">
              <span className="w-5 h-0.5 bg-blue-600 rounded"></span>
              Actualités & Blog
            </div>
            <h2 className="text-4xl font-bold text-gray-900">
              La vie de <span className="italic font-light text-blue-600">l'école</span>
            </h2>
          </div>
          <button className="border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition">
            Voir tous les articles →
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {ARTICLES.map((a, i) => (
            <div key={a.title}
              className={`border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white ${a.featured ? 'md:row-span-2' : ''}`}>
              <div className={`bg-gradient-to-br ${a.bg} ${a.featured ? 'h-56' : 'h-36'} flex items-end p-5`}>
                <span className="bg-yellow-500 text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full">{a.cat}</span>
              </div>
              <div className="p-5">
                <div className="text-xs text-gray-400 font-semibold mb-2">{a.date}</div>
                <h3 className={`font-bold text-gray-900 leading-snug mb-2 ${a.featured ? 'text-lg' : 'text-sm'}`}>{a.title}</h3>
                {(a.featured || i === 0) && <p className="text-gray-500 text-sm leading-relaxed">{a.excerpt}</p>}
                <div className="text-blue-600 text-xs font-bold mt-3">Lire l'article →</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}