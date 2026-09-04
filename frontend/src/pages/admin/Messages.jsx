import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactApi } from '../../api/contact'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import StatCard from '../../components/ui/StatCard'

export default function Messages() {
  const [filter, setFilter] = useState('false') // 'false' = à traiter, 'true' = traités, '' = tous
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(null)

  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['messages-contact', filter, page],
    queryFn: () => contactApi.getAll({ isTraite: filter || undefined, page, limit: 15 }),
    keepPreviousData: true
  })
  const messages = data?.data?.data || []
  const meta = data?.data?.meta || {}

  const { mutate: marquerTraite, isPending } = useMutation({
    mutationFn: (id) => contactApi.marquerTraite(id),
    onSuccess: () => {
      toast.success('Marqué comme traité')
      qc.invalidateQueries({ queryKey: ['messages-contact'] })
      setOpen(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur')
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Messages de contact</h1>
        <p className="text-sm text-gray-500 mt-0.5">Formulaire de contact du site vitrine</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <StatCard icon="📬" bg="bg-amber-50" label="À traiter" value={meta.nonTraites || 0} />
        <StatCard icon="📊" bg="bg-gray-50" label="Total" value={meta.total || 0} />
      </div>

      <div className="flex gap-2">
        {[['false', 'À traiter'], ['true', 'Traités'], ['', 'Tous']].map(([val, label]) => (
          <button key={val} onClick={() => { setFilter(val); setPage(1) }}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition ${filter === val ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? <Spinner /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Contact</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Sujet</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Reçu le</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Statut</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {messages.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer" onClick={() => setOpen(m)}>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{m.prenom} {m.nom}</div>
                      <div className="text-xs text-gray-400">{m.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 max-w-xs truncate">{m.sujet}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(m.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={m.isTraite ? 'Traité' : 'À traiter'} variant={m.isTraite ? 'green' : 'amber'} />
                    </td>
                    <td className="px-5 py-3.5 text-right text-blue-600 text-xs font-semibold">Voir →</td>
                  </tr>
                ))}
                {!messages.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="text-4xl mb-3">📭</div>
                      <div className="font-semibold text-gray-500">Aucun message</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {meta.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">Page {meta.page} sur {meta.totalPages} · {meta.total} messages</span>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                    ← Préc.
                  </button>
                  <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                    className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                    Suiv. →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-gray-900">{open.prenom} {open.nom}</h2>
              <button onClick={() => setOpen(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-0.5">Email</div>
                  <div className="text-gray-900">{open.email}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-0.5">Téléphone</div>
                  <div className="text-gray-900">{open.telephone || '—'}</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 mb-0.5">Sujet</div>
                <div className="text-gray-900 font-semibold">{open.sujet}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 mb-1">Message</div>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">{open.message}</div>
              </div>
              <div className="text-xs text-gray-400">
                Reçu le {new Date(open.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {open.isTraite && open.traitant && ` · Traité par ${open.traitant.prenom} ${open.traitant.nom}`}
              </div>
              <div className="flex gap-3 pt-2">
                <a href={`mailto:${open.email}`}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition text-center">
                  📧 Répondre par email
                </a>
                {!open.isTraite && (
                  <button onClick={() => marquerTraite(open.id)} disabled={isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition">
                    {isPending ? '...' : 'Marquer traité'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
