import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileDown, FileText, Sheet } from 'lucide-react'
import api from '../lib/api'
import { cn } from '../lib/utils'

export default function ReportsPage() {
  const now = new Date()
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0])
  const [generated, setGenerated] = useState(false)

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['report-frequency', startDate, endDate],
    queryFn: async () => {
      const res = await api.get(`/reports/frequency?startDate=${startDate}&endDate=${endDate}&status=ACTIVE`)
      return res.data.report
    },
    enabled: false,
  })

  const handleGenerate = () => {
    setGenerated(true)
    refetch()
  }

  const exportCSV = () => {
    if (!data) return
    const headers = ['Nome', 'Total de Aulas', 'Presenças', 'Faltas', 'Frequência (%)']
    const rows = data.map((r: any) => [r.name, r.total, r.presences, r.absences, r.percentage])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-frequencia-${startDate}-${endDate}.csv`
    link.click()
  }

  const exportPDF = async () => {
    if (!data) return
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Relatório de Frequência', 14, 20)
    doc.setFontSize(11)
    doc.text(`Período: ${startDate} a ${endDate}`, 14, 30)
    autoTable(doc, {
      startY: 38,
      head: [['Nome', 'Aulas', 'Presenças', 'Faltas', 'Frequência']],
      body: data.map((r: any) => [r.name, r.total, r.presences, r.absences, `${r.percentage}%`]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [16, 185, 129] },
    })
    doc.save(`relatorio-frequencia-${startDate}-${endDate}.pdf`)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Relatórios</h2>

      {/* Filters */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Data inicial</label>
            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Data final</label>
            <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={handleGenerate} className="btn-primary w-full">
              Gerar Relatório
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {generated && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Frequência de Alunos</h3>
            {data && (
              <div className="flex gap-2">
                <button onClick={exportCSV} className="btn-secondary text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> CSV
                </button>
                <button onClick={exportPDF} className="btn-secondary text-sm flex items-center gap-1.5">
                  <FileDown className="w-4 h-4" /> PDF
                </button>
              </div>
            )}
          </div>

          {isFetching ? (
            <div className="p-8 text-center text-slate-400">Gerando relatório...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-6 py-3">Aluno</th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase px-4 py-3">Total</th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase px-4 py-3">Presenças</th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase px-4 py-3">Faltas</th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase px-4 py-3">Frequência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">{r.name}</td>
                      <td className="px-4 py-4 text-center text-slate-600">{r.total}</td>
                      <td className="px-4 py-4 text-center text-emerald-600 font-semibold">{r.presences}</td>
                      <td className="px-4 py-4 text-center text-red-500 font-semibold">{r.absences}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn(
                          'font-bold',
                          r.percentage >= 75 ? 'text-emerald-600' :
                          r.percentage >= 50 ? 'text-amber-500' : 'text-red-500'
                        )}>
                          {r.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
