import { useQuery } from '@tanstack/react-query'
import { evenementsApi } from '../../../api/evenements'

// Same type→color mapping the old hardcoded EVENTS array used, keyed by
// the free-text `type` field now coming from the CMS instead of a fixed
// enum - anything not in this map (a type staff typed in themselves)
// falls back to the blue scheme rather than breaking.
const TYPE_STYLES = {
  'PORTES OUVERTES': { color: 'text-blue-600', bg: 'bg-blue-50', btn: 'bg-blue-600' },
  'TEST ADMISSION':  { color: 'text-yellow-600', bg: 'bg-yellow-50', btn: 'bg-yellow-500' },
  'FORUM EMPLOI':    { color: 'text-teal-600', bg: 'bg-teal-50', btn: 'bg-teal-600' },
}
const DEFAULT_STYLE = { color: 'text-blue-600', bg: 'bg-blue-50', btn: 'bg-blue-600' }

export default function Evenements() {
  const scrollToInscr = () =>
    document.querySelector('#preinscription')?.scrollIntoView({ behavior: 'smooth' })

  const { data, isLoading } = useQuery({
    queryKey: ['evenements-public'],
    queryFn: () => evenementsApi.getPublic({ limit: 3 })
  })
  const evenements = data?.data?.data || []

  if (!isLoading && !evenements.length) return null

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
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[0, 1, 2].map(i => <div key={i} className="h-40 rounded-2xl bg-white border border-gray-200 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {evenements.map(e => {
              const style = TYPE_STYLES[e.type] || DEFAULT_STYLE
              const date = new Date(e.dateDebut)
              const day = date.toLocaleDateString('fr-FR', { day: '2-digit' })
              const mon = date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '')
              return (
                <div key={e.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="p-5 flex items-center gap-4">
                    <div className={`w-14 h-14 ${style.bg} rounded-xl flex flex-col items-center justify-center flex-shrink-0`}>
                      <div className={`text-2xl font-black leading-none ${style.color}`}>{day}</div>
                      <div className={`text-xs font-bold ${style.color}`}>{mon}</div>
                    </div>
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-wide ${style.color} mb-1`}>{e.type}</div>
                      <div className="font-bold text-gray-900 text-sm leading-snug">{e.titre}</div>
                    </div>
                  </div>
                  <div className="px-5 pb-4 text-gray-500 text-sm leading-relaxed">{e.description}</div>
                  <div className="px-5 pb-5 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{e.lieu}</span>
                    <button onClick={scrollToInscr}
                      className={`${style.btn} hover:opacity-90 text-white text-xs font-bold px-4 py-2 rounded-lg transition`}>
                      S'inscrire
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
