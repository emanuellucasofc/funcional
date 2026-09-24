import { useQuery } from '@tanstack/react-query'
import { Users, CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import api from '../lib/api'
import { Alert } from '../types'
import { AlertBadge } from '../components/ui/Badge'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: any, label: string, value: number | string, color: string, sub?: string
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div>
        <p className="text-slate-500 text-sm">{label}</p>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())

  const todayStr = format(today, 'yyyy-MM-dd')

  const { data: frequency } = useQuery({
    queryKey: ['frequency-monthly', month, year],
    queryFn: async () => {
      const res = await api.get(`/frequency/monthly?month=${month}&year=${year}`)
      return res.data
    },
  })

  const { data: todayAttendance } = useQuery({
    queryKey: ['attendance-today', todayStr],
    queryFn: async () => {
      const res = await api.get(`/attendance/date/${todayStr}`)
      return res.data
    },
  })

  const { data: alertsData } = useQuery({
    queryKey: ['alerts-unread'],
    queryFn: async () => {
      const res = await api.get('/alerts?isRead=false')
      return res.data.alerts as Alert[]
    },
  })

  // Calculate today stats
  const todayClasses = todayAttendance?.classes ?? []
  const todayPresent = todayClasses.flatMap((c: any) => c.students).filter((s: any) => s.attendance?.status === 'PRESENT').length
  const todayAbsent = todayClasses.flatMap((c: any) => c.students).filter((s: any) => s.attendance?.status === 'ABSENT').length

  // Chart data from daily breakdown
  const chartData = Object.entries(frequency?.dailyBreakdown ?? {}).map(([date, data]: any) => ({
    date: format(new Date(date + 'T00:00:00'), 'dd/MM', { locale: ptBR }),
    Presenças: data.present,
    Faltas: data.absent,
  }))

  const months = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
  ]

  return (
    <div className="space-y-6">
      {/* Date */}
      <p className="text-slate-500 text-sm">
        {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </p>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Alunos Ativos"
          value={frequency?.activeStudents ?? '—'}
          color="bg-emerald-500"
          sub="matriculados"
        />
        <StatCard
          icon={CheckCircle}
          label="Presentes Hoje"
          value={todayPresent}
          color="bg-blue-500"
          sub={todayClasses.length > 0 ? `em ${todayClasses.length} turma(s)` : 'sem treino hoje'}
        />
        <StatCard
          icon={XCircle}
          label="Faltas Hoje"
          value={todayAbsent}
          color="bg-red-500"
          sub="registradas"
        />
        <StatCard
          icon={AlertTriangle}
          label="Com Alerta"
          value={alertsData?.length ?? 0}
          color="bg-amber-500"
          sub="alertas ativos"
        />
      </div>

      {/* Chart + Alerts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-slate-800">Frequência do Mês</h2>
              <p className="text-sm text-slate-500">
                {frequency?.percentage ?? 0}% de frequência geral
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="Presenças" stroke="#10b981" fill="url(#colorPresent)" strokeWidth={2} />
                <Area type="monotone" dataKey="Faltas" stroke="#ef4444" fill="url(#colorAbsent)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              Nenhum dado para o período selecionado.
            </div>
          )}
        </div>

        {/* Alerts Panel */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">⚠️ Alertas</h2>
            <span className="text-xs text-slate-400">{alertsData?.length ?? 0} ativo(s)</span>
          </div>

          {alertsData?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mb-2" />
              <p className="text-slate-500 text-sm">Nenhum alerta ativo</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {alertsData?.slice(0, 8).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{alert.student.name}</p>
                    <p className="text-xs text-slate-500">{alert.absences} faltas</p>
                    <AlertBadge type={alert.type} />
                  </div>
                  <button
                    onClick={() => navigate(`/alunos/${alert.studentId}`)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex-shrink-0"
                  >
                    Ver
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/alertas')}
            className="w-full mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Ver todos os alertas →
          </button>
        </div>
      </div>

      {/* Quick action: go to today's attendance */}
      <div className="card bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">📋 Lista de Chamada</h3>
            <p className="text-emerald-100 text-sm mt-1">
              Abra a chamada de hoje rapidamente
            </p>
          </div>
          <button
            onClick={() => navigate('/chamada')}
            className="bg-white text-emerald-600 font-semibold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors"
          >
            Abrir Chamada
          </button>
        </div>
      </div>
    </div>
  )
}
