import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import api from '../lib/api'
import { AttendanceClass, AttendanceStudent } from '../types'
import { useToast } from '../components/ui/Toast'
import { cn } from '../lib/utils'

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Segunda-feira',
  TUESDAY: 'Terça-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira',
  FRIDAY: 'Sexta-feira',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
}

const TRAINING_DAYS = ['MONDAY', 'WEDNESDAY', 'FRIDAY']

function StudentAttendanceRow({
  student,
  classId,
  date,
}: {
  student: AttendanceStudent
  classId: string
  date: string
}) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [optimistic, setOptimistic] = useState<'PRESENT' | 'ABSENT' | null>(
    student.attendance?.status ?? null
  )

  const mutation = useMutation({
    mutationFn: async (status: 'PRESENT' | 'ABSENT') => {
      const res = await api.post('/attendance', {
        studentId: student.id,
        classId,
        date,
        status,
      })
      return res.data
    },
    onMutate: (status) => {
      setOptimistic(status)
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', date] })
      queryClient.invalidateQueries({ queryKey: ['alerts-count'] })
    },
    onError: () => {
      toast('error', 'Erro ao registrar chamada.')
      setOptimistic(student.attendance?.status ?? null)
    },
  })

  const current = optimistic

  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
      current === 'PRESENT' && 'border-emerald-200 bg-emerald-50',
      current === 'ABSENT' && 'border-red-200 bg-red-50',
      !current && 'border-slate-100 bg-white'
    )}>
      {/* Avatar */}
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold',
        current === 'PRESENT' && 'bg-emerald-200 text-emerald-700',
        current === 'ABSENT' && 'bg-red-200 text-red-700',
        !current && 'bg-slate-100 text-slate-600'
      )}>
        {student.name[0]}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 truncate">{student.name}</p>
        {current && (
          <p className={cn(
            'text-xs font-medium',
            current === 'PRESENT' ? 'text-emerald-600' : 'text-red-500'
          )}>
            {current === 'PRESENT' ? '✅ Presente' : '❌ Falta'}
          </p>
        )}
      </div>

      {/* Buttons — BIG for mobile */}
      <div className="flex gap-2">
        <button
          onClick={() => mutation.mutate('PRESENT')}
          disabled={mutation.isPending}
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95',
            current === 'PRESENT'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
              : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'
          )}
        >
          <CheckCircle className="w-6 h-6" />
        </button>
        <button
          onClick={() => mutation.mutate('ABSENT')}
          disabled={mutation.isPending}
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95',
            current === 'ABSENT'
              ? 'bg-red-500 text-white shadow-md shadow-red-200'
              : 'bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-500'
          )}
        >
          <XCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}

function ClassSection({ cls, date }: { cls: AttendanceClass; date: string }) {
  const [expanded, setExpanded] = useState(true)
  const markedCount = cls.students.filter((s) => s.attendance).length
  const total = cls.students.length
  const allDone = markedCount === total && total > 0

  return (
    <div className="card overflow-hidden p-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors text-left"
      >
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
          allDone ? 'bg-emerald-100' : 'bg-slate-100'
        )}>
          <Clock className={cn('w-6 h-6', allDone ? 'text-emerald-600' : 'text-slate-500')} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-800">{cls.startTime} — {cls.endTime}</p>
          <p className="text-sm text-slate-500">{cls.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'text-sm font-semibold px-3 py-1 rounded-full',
            allDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
          )}>
            {markedCount}/{total}
          </span>
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-2">
          {cls.students.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-6">Nenhum aluno nesta turma.</p>
          ) : (
            cls.students.map((student) => (
              <StudentAttendanceRow
                key={student.id}
                student={student}
                classId={cls.id}
                date={date}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function AttendancePage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', date],
    queryFn: async () => {
      const res = await api.get(`/attendance/date/${date}`)
      return res.data
    },
  })

  const isTrainingDay = data?.dayOfWeek ? TRAINING_DAYS.includes(data.dayOfWeek) : false
  const classes: AttendanceClass[] = data?.classes ?? []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Date selector */}
      <div className="card py-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-emerald-500" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input flex-1"
          />
          <button
            onClick={() => setDate(today)}
            className="btn-secondary text-sm"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Day label */}
      {data && (
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">
            {DAY_LABELS[data.dayOfWeek]}
          </h2>
          <p className="text-slate-500 text-sm">
            {format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-32 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : !isTrainingDay ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🏃</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Sem treino neste dia
          </h3>
          <p className="text-slate-500 text-sm">
            O Treinamento de Funcional acontece às
            <br />
            <strong>segundas, quartas e sextas-feiras</strong>.
          </p>
        </div>
      ) : classes.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          Nenhuma turma configurada para este dia.
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => (
            <ClassSection key={cls.id} cls={cls} date={date} />
          ))}
        </div>
      )}
    </div>
  )
}
