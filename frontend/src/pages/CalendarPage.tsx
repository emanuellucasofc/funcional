import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: async () => {
      const res = await api.get(`/calendar/${year}/${month}`)
      return res.data.days
    },
  })

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Fill empty days at the start of the grid
  const startDayIndex = monthStart.getDay() // 0 = Sunday
  const emptyDays = Array.from({ length: startDayIndex }).map((_, i) => `empty-${i}`)
  const allDays = [...emptyDays, ...daysInMonth]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETE': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      case 'PARTIAL': return <AlertCircle className="w-5 h-5 text-amber-500" />
      case 'PENDING': return <AlertCircle className="w-5 h-5 text-red-500" />
      default: return <Clock className="w-5 h-5 text-slate-300" />
    }
  }

  const getStatusClasses = (status?: string) => {
    switch (status) {
      case 'COMPLETE': return 'bg-emerald-50 border-emerald-200'
      case 'PARTIAL': return 'bg-amber-50 border-amber-200'
      case 'PENDING': return 'bg-red-50 border-red-200'
      case 'FUTURE': return 'bg-slate-50 border-slate-200'
      default: return 'bg-white border-slate-100 opacity-50' // Non-training days
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Calendário de Treinos</h1>
        
        <div className="flex items-center justify-between gap-4 bg-white px-4 py-2 rounded-xl border shadow-sm">
          <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="font-medium w-32 text-center text-slate-700 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="card p-0 sm:p-6 overflow-x-auto">
        <div className="min-w-[768px] p-4 sm:p-0">
          <div className="grid grid-cols-7 gap-px mb-2 text-center">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="font-semibold text-slate-500 text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">Carregando...</div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {allDays.map((day, index) => {
                if (typeof day === 'string') {
                  return <div key={day} className="min-h-24 rounded-lg bg-transparent border-0" />
                }

                const dateStr = day.toISOString().split('T')[0]
                const info = calendarData?.[dateStr]
                const today = isToday(day)

                return (
                  <div 
                    key={dateStr} 
                    className={`min-h-28 border rounded-lg p-2 sm:p-3 transition-all ${getStatusClasses(info?.status)} ${today ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-bold ${today ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {format(day, 'd')}
                      </span>
                      {info && getStatusIcon(info.status)}
                    </div>
                    
                    {info && (
                      <div className="text-xs space-y-1 mt-2 sm:mt-3">
                        <div className="font-medium text-slate-700">
                          {info.status === 'FUTURE' ? 'Previsto' : 'Chamada:'}
                        </div>
                        <div className="text-slate-500">
                          {info.marked} / {info.total} alunos
                        </div>
                        {info.status === 'COMPLETE' && (
                          <div className="text-emerald-600 font-medium mt-1">Concluída</div>
                        )}
                        {info.status === 'PARTIAL' && (
                          <div className="text-amber-600 font-medium mt-1">Incompleta</div>
                        )}
                        {info.status === 'PENDING' && (
                          <div className="text-red-600 font-medium mt-1">Pendente</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-6 items-center text-sm text-slate-600 bg-white p-4 rounded-lg border">
        <span className="font-semibold text-slate-800">Legenda:</span>
        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Chamada Completa</div>
        <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500"/> Faltam Alunos</div>
        <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500"/> Chamada Pendente</div>
        <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-300"/> Próximos Treinos</div>
      </div>
    </div>
  )
}

