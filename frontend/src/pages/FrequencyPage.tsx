import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import api from '../lib/api'

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Segunda',
  TUESDAY: 'Terça',
  WEDNESDAY: 'Quarta',
  THURSDAY: 'Quinta',
  FRIDAY: 'Sexta',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
}

export default function FrequencyPage() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())

  const { data: report, isLoading } = useQuery({
    queryKey: ['frequency-by-class', month, year],
    queryFn: async () => {
      const res = await api.get(`/reports/by-class?month=${month}&year=${year}`)
      return res.data.report
    },
  })

  const months = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
  ]

  const chartData = report?.map((item: any) => ({
    name: `${DAY_LABELS[item.class.dayOfWeek]} ${item.class.startTime}`,
    Presenças: item.present,
    Faltas: item.absent,
    'Taxa (%)': item.percentage,
  })) ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Análise de Frequência</h1>
          <p className="text-slate-500 text-sm">Desempenho por dia da semana e horário</p>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm">
          <select
            className="text-sm bg-transparent font-medium text-slate-700 focus:outline-none"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <span className="text-slate-300">/</span>
          <select
            className="text-sm bg-transparent font-medium text-slate-700 focus:outline-none"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-6">Frequência por Turma</h2>
        
        {isLoading ? (
          <div className="h-72 flex items-center justify-center">Carregando...</div>
        ) : chartData.length > 0 ? (
          <div className="h-80 w-full overflow-x-auto">
            <div className="min-w-[800px] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="Presenças" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} maxBarSize={50} />
                  <Bar dataKey="Faltas" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-slate-400">
            Nenhum dado encontrado para este mês.
          </div>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase px-6 py-4">Turma (Dia e Hora)</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase px-6 py-4">Presenças</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase px-6 py-4">Faltas</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase px-6 py-4">Total</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase px-6 py-4">Taxa de Frequência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">Carregando...</td>
                </tr>
              ) : report?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">Nenhum dado disponível.</td>
                </tr>
              ) : (
                report?.map((item: any) => (
                  <tr key={item.class.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">
                        {DAY_LABELS[item.class.dayOfWeek]} • {item.class.startTime}
                      </div>
                      <div className="text-xs text-slate-500">{item.class.name}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-emerald-600">
                      {item.present}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-red-500">
                      {item.absent}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">
                      {item.total}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.percentage >= 75 ? 'bg-emerald-100 text-emerald-800' :
                        item.percentage >= 50 ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.percentage}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
