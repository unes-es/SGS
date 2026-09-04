import { useQuery } from '@tanstack/react-query'
import { actualitesApi } from '../../../api/actualites'

// Same gradient set the old hardcoded ARTICLES array used, cycled by
// index so cards still look varied when an article has no imageUrl -
// most won't, until staff start uploading images via the CMS.
const GRADIENTS = ['from-blue-950 to-teal-950', 'from-violet-950 to-rose-950', 'from-emerald-950 to-teal-950', 'from-orange-950 to-amber-950']

export default function Actualites() {
  const { data, isLoading } = useQuery({
    queryKey: ['actualites-public'],
    queryFn: () => actualitesApi.getPublic({ limit: 4 })
  })
  const articles = data?.data?.data || []

  // Nothing published yet — the section quietly doesn't render rather
  // than showing an empty "La vie de l'école" header with nothing under
  // it. Comes back the moment staff publish a first article.
  if (!isLoading && !articles.length) return null

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
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[0, 1, 2].map(i => <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {articles.map((a, i) => (
              <div key={a.id}
                className={`border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white ${i === 0 ? 'md:row-span-2' : ''}`}>
                <div
                  className={`relative flex items-end p-5 ${i === 0 ? 'h-56' : 'h-36'} ${a.imageUrl ? '' : `bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`}`}
                  style={a.imageUrl ? { backgroundImage: `url(${a.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                >
                  <span className="bg-yellow-500 text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full">{a.categorie}</span>
                </div>
                <div className="p-5">
                  <div className="text-xs text-gray-400 font-semibold mb-2">
                    {a.publishedAt && new Date(a.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <h3 className={`font-bold text-gray-900 leading-snug mb-2 ${i === 0 ? 'text-lg' : 'text-sm'}`}>{a.titre}</h3>
                  {i === 0 && <p className="text-gray-500 text-sm leading-relaxed">{a.extrait}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
