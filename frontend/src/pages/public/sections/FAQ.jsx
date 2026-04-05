import { useState } from 'react'

const FAQS = [
  { q:'Quels sont les prérequis pour s\'inscrire ?', a:'Pour les BTS, le Baccalauréat est obligatoire (toutes séries). Pour les Licences, un BTS ou équivalent Bac+2 est requis. Des tests d\'admission sont organisés pour évaluer le niveau des candidats.' },
  { q:'Y a-t-il des bourses ou facilités de paiement ?', a:'Oui ! Nous proposons un échéancier mensuel, trimestriel ou annuel. Des réductions sont accordées aux étudiants boursiers (CNSS) et aux fratries. Contactez notre service financier pour plus d\'informations.' },
  { q:'Les diplômes sont-ils reconnus par l\'État ?', a:'Nos diplômes BTS sont reconnus par l\'OFPPT. Nos licences sont accréditées par le Ministère de l\'Enseignement Supérieur du Maroc.' },
  { q:'Est-ce possible de travailler pendant la formation ?', a:'Absolument. Nos cours sont organisés en journée (8h–17h) avec une option d\'horaires aménagés pour les salariés. Nous proposons également une formule hybride présentiel/distanciel.' },
  { q:'Comment se déroule l\'inscription en ligne ?', a:'Remplissez le formulaire de candidature sur cette page. Vous recevrez une confirmation par email et SMS. Notre équipe vous contactera dans les 48h pour valider votre dossier.' },
  { q:'Quel est le taux d\'encadrement professeurs/étudiants ?', a:'Nous maintenons un ratio de 1 professeur pour 12 à 15 étudiants en moyenne, permettant un suivi personnalisé. Les groupes de TP sont limités à 20 étudiants.' },
  { q:'Y a-t-il un internat ou des logements étudiants ?', a:'Nous n\'avons pas d\'internat propre, mais nous avons des partenariats avec des résidences étudiantes à proximité des deux campus, à des tarifs préférentiels.' },
  { q:'Puis-je changer de filière en cours d\'année ?', a:'Un changement est possible en fin de 1er semestre sous réserve de places disponibles et d\'un entretien avec le directeur pédagogique. Des frais administratifs de 500 MAD s\'appliquent.' },
]

export default function FAQ() {
  const [open, setOpen] = useState(null)

  return (
    <section id="faq" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-14">
          <div className="flex items-center gap-3 text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">
            <span className="w-5 h-0.5 bg-blue-600 rounded"></span>
            FAQ
          </div>
          <h2 className="text-4xl font-bold text-gray-900">
            Questions <span className="italic font-light text-blue-600">fréquentes</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {FAQS.map((f, i) => (
            <div key={i}
              className={`border rounded-2xl overflow-hidden cursor-pointer transition-all ${
                open === i ? 'border-blue-400 bg-white' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setOpen(open === i ? null : i)}>
              <div className="px-5 py-4 flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-900 text-sm">{f.q}</span>
                <span className={`text-xl flex-shrink-0 transition-transform ${open === i ? 'rotate-45 text-blue-600' : 'text-gray-400'}`}>+</span>
              </div>
              {open === i && (
                <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}