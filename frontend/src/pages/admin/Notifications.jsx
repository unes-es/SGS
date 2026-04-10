import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../../api/notifications'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { useNavigate } from 'react-router-dom'

const TYPE_ICONS = {
    IMPAYES: '💸',
    ABSENCE: '📅',
    CANDIDATURE: '📋',
    PAIEMENT: '💰',
    SYSTEME: '⚙️',
}

const TYPE_COLORS = {
    IMPAYES: 'red',
    ABSENCE: 'amber',
    CANDIDATURE: 'blue',
    PAIEMENT: 'green',
    SYSTEME: 'gray',
}

export default function Notifications() {
    const navigate = useNavigate()
    const qc = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['notifications-all'],
        queryFn: () => notificationsApi.getAll({ limit: 50 })
    })

    const { mutate: markAllRead } = useMutation({
        mutationFn: notificationsApi.markAllRead,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifications'] })
            qc.invalidateQueries({ queryKey: ['notifications-all'] })
            toast.success('Toutes les notifications marquées comme lues')
        }
    })

    const { mutate: markRead } = useMutation({
        mutationFn: notificationsApi.markRead,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifications'] })
            qc.invalidateQueries({ queryKey: ['notifications-all'] })
        }
    })

    const notifications = data?.data?.data || []
    const unread = data?.data?.meta?.unread || 0

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {unread > 0 ? `${unread} non lue(s)` : 'Tout est lu'}
                    </p>
                </div>
                {unread > 0 && (
                    <button
                        onClick={() => markAllRead()}
                        className="border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                        ✅ Tout marquer lu
                    </button>
                )}
            </div>

            <Card>
                {isLoading ? <Spinner /> : (
                    <div className="divide-y divide-gray-50">
                        {notifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => {
                                    if (!n.isRead) markRead(n.id)
                                    if (n.link) navigate(n.link)
                                }}
                                className={`px-5 py-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition ${!n.isRead ? 'bg-blue-50/40' : ''
                                    }`}>
                                <div className="text-2xl flex-shrink-0">{TYPE_ICONS[n.type] || '🔔'}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`font-semibold text-sm ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {n.titre}
                                        </span>
                                        <Badge label={n.type} variant={TYPE_COLORS[n.type]} />
                                        {!n.isRead && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-0.5">{n.message}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                                            weekday: 'short', day: 'numeric', month: 'short',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!notifications.length && (
                            <div className="px-5 py-16 text-center">
                                <div className="text-4xl mb-3">🔔</div>
                                <div className="font-semibold text-gray-500">Aucune notification</div>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    )
}