import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCheck, Eye } from 'lucide-react'
import api from '../lib/api'
import { Alert } from '../types'
import { AlertBadge } from '../components/ui/Badge'
import { useToast } from '../components/ui/Toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const MONTHS = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function AlertsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await api.get('/alerts')
      return res.data.alerts as Alert[]
    },
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/alerts/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['alerts-count'] })
    },
  })

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/alerts/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['alerts-count'] })
      toast('success', 'Todos os alertas marcados como lidos.')
    },
  })

  const unread = data?.filter((a) => !a.isRead) ?? []
  const read = data?.filter((a) => a.isRead) ?? []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Alertas de Frequência</h2>
          <p className="text-slate-500 text-sm">{unread.length} alerta(s) não lido(s)</p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todos como lidos
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card h-24 animate-pulse bg-slate-100" />)}
        </div>
      ) : data?.length === 0 ? (
        <div className="card text-center py-16">
          <AlertTriangle className="w-12 h-12 mx-auto text-slate-200 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600">Nenhum alerta</h3>
          <p className="text-slate-400 text-sm mt-1">Todos os alunos estão com frequência dentro do esperado.</p>
        </div>
      ) : (
        <>
          {/* Unread */}
          {unread.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Não lidos</h3>
              <div className="space-y-3">
                {unread.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onRead={() => markRead.mutate(alert.id)}
                    onView={() => navigate(`/alunos/${alert.studentId}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Read */}
          {read.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Lidos</h3>
              <div className="space-y-3 opacity-60">
                {read.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onRead={() => {}}
                    onView={() => navigate(`/alunos/${alert.studentId}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AlertCard({ alert, onRead, onView }: { alert: Alert; onRead: () => void; onView: () => void }) {
  return (
    <div className={`card border-l-4 py-4 ${
      alert.type === 'CRITICAL' ? 'border-red-500' :
      alert.type === 'ALERT' ? 'border-orange-500' : 'border-amber-400'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          alert.type === 'CRITICAL' ? 'bg-red-100' :
          alert.type === 'ALERT' ? 'bg-orange-100' : 'bg-amber-100'
        }`}>
          <AlertTriangle className={`w-5 h-5 ${
            alert.type === 'CRITICAL' ? 'text-red-500' :
            alert.type === 'ALERT' ? 'text-orange-500' : 'text-amber-500'
          }`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-slate-800">{alert.student.name}</p>
            <AlertBadge type={alert.type} />
          </div>
          <p className="text-slate-600 text-sm">{alert.message}</p>
          <p className="text-slate-400 text-xs mt-1">
            {MONTHS[alert.month]} de {alert.year} • {alert.absences} falta(s)
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={onView} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            Ver aluno
          </button>
          {!alert.isRead && (
            <button onClick={onRead} className="btn-secondary text-xs py-1.5 px-3">
              Marcar lido
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
