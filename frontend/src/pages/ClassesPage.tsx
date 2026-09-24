import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Users, Plus, Trash2 } from 'lucide-react'
import api from '../lib/api'
import { Class } from '../types'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui/Toast'

const DAY_ORDER = ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'TUESDAY', 'THURSDAY', 'SATURDAY', 'SUNDAY']
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Segunda-feira', WEDNESDAY: 'Quarta-feira', FRIDAY: 'Sexta-feira',
  TUESDAY: 'Terça-feira', THURSDAY: 'Quinta-feira', SATURDAY: 'Sábado', SUNDAY: 'Domingo',
}

export default function ClassesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/classes')
      return res.data.classes as Class[]
    },
  })

  const classes = data ?? []

  const grouped = DAY_ORDER.reduce((acc, day) => {
    const dayClasses = classes.filter((c) => c.dayOfWeek === day && c.isActive)
    if (dayClasses.length > 0) acc[day] = dayClasses
    return acc
  }, {} as Record<string, Class[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Turmas e Horários</h2>
          <p className="text-slate-500 text-sm">{classes.filter(c => c.isActive).length} turmas ativas</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="card h-40 animate-pulse bg-slate-100" />)}
        </div>
      ) : (
        Object.entries(grouped).map(([day, dayClasses]) => (
          <div key={day} className="card">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{DAY_LABELS[day]}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {dayClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="border border-slate-100 rounded-xl p-4 hover:border-emerald-200 hover:bg-emerald-50 transition-all cursor-pointer"
                  onClick={() => navigate(`/chamada?date=${getTodayOrNextDay(day)}`)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-slate-800">{cls.startTime}</span>
                    <span className="text-slate-400">–</span>
                    <span className="font-bold text-slate-800">{cls.endTime}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{cls.name}</p>
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Users className="w-4 h-4" />
                    <span>{cls._count?.studentClasses ?? 0} alunos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function getTodayOrNextDay(targetDay: string): string {
  return new Date().toISOString().split('T')[0]
}
