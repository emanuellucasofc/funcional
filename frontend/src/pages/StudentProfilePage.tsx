import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { ArrowLeft, User, Phone, Mail, Calendar, Edit, Activity, HeartPulse, MapPin } from 'lucide-react'
import { StatusBadge } from '../components/ui/Badge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const res = await api.get(`/students/${id}`)
      return res.data.student
    },
  })

  const { data: freqData } = useQuery({
    queryKey: ['frequency', id],
    queryFn: async () => {
      const res = await api.get(`/frequency/student/${id}`)
      return res.data
    },
  })

  if (isLoading) return <div>Carregando...</div>
  if (!student) return <div>Aluno não encontrado</div>

  const daysMap: Record<string, string> = {
    MONDAY: 'Segunda', TUESDAY: 'Terça', WEDNESDAY: 'Quarta',
    THURSDAY: 'Quinta', FRIDAY: 'Sexta', SATURDAY: 'Sábado', SUNDAY: 'Domingo',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/alunos')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Perfil do Aluno</h1>
        </div>
        <Link to={`/alunos/${id}/editar`} className="btn-primary flex items-center gap-2">
          <Edit className="w-4 h-4" /> Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="card p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{student.name}</h2>
            <StatusBadge status={student.status} />

            <div className="w-full mt-6 space-y-4 text-left">
              {student.cpf && (
                <div className="flex items-center gap-3 text-slate-600">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">CPF: {student.cpf}</span>
                </div>
              )}
              {student.phone && (
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{student.phone}</span>
                </div>
              )}
              {student.emergencyContact && (
                <div className="flex items-center gap-3 text-red-600">
                  <Phone className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium">Emergência: {student.emergencyContact}</span>
                </div>
              )}
              {student.email && (
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{student.email}</span>
                </div>
              )}
              {student.birthDate && (
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">Nasceu: {format(new Date(student.birthDate), "dd/MM/yyyy")}</span>
                </div>
              )}
              {student.age && (
                <div className="flex items-center gap-3 text-slate-600">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{student.age} anos</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm">
                  Matriculado: {format(new Date(student.createdAt), "dd/MM/yyyy")}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
               <MapPin className="w-4 h-4" /> Endereço
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              {student.address ? <p>{student.address}</p> : <p className="text-slate-400 italic">Endereço não informado</p>}
              {student.city && <p>{student.city} {student.state && `- ${student.state}`}</p>}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
               <HeartPulse className="w-4 h-4 text-rose-500" /> Saúde & Biometria
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block mb-1">Peso</span>
                <span className="font-medium text-slate-800">{student.weight ? `${student.weight} kg` : '-'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block mb-1">Altura</span>
                <span className="font-medium text-slate-800">{student.height ? `${student.height} m` : '-'}</span>
              </div>
            </div>
            {student.hasHealthIssues ? (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="font-medium text-red-700 text-sm mb-1">Restrição de Saúde</p>
                <p className="text-sm text-red-600">{student.healthIssuesDetails || 'Nenhum detalhe informado.'}</p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg font-medium">
                Nenhum problema de saúde
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Turmas Matriculadas</h3>
            {student.studentClasses.length > 0 ? (
              <ul className="space-y-3">
                {(() => {
                  const map = new Map<string, any>()
                  for (const sc of student.studentClasses) {
                    const key = `${sc.class.startTime}-${sc.class.endTime}`
                    if (!map.has(key)) map.set(key, { startTime: sc.class.startTime, endTime: sc.class.endTime, days: [] })
                    map.get(key).days.push(sc.class.dayOfWeek)
                  }
                  return Array.from(map.values()).map((group) => (
                    <li key={`${group.startTime}-${group.endTime}`} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                      <span className="font-medium text-slate-700">
                        {group.days.map((d: string) => daysMap[d].substring(0, 3)).join(', ')}
                      </span>
                      <span className="text-slate-600 font-semibold bg-slate-100 px-2 py-1 rounded">
                        {group.startTime} às {group.endTime}
                      </span>
                    </li>
                  ))
                })()}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Nenhuma turma vinculada.</p>
            )}
          </div>

          {student.notes && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Observações Gerais</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{student.notes}</p>
            </div>
          )}
        </div>

        {/* Frequency & History */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="text-sm text-slate-500 mb-1">Frequência (Mês atual)</div>
              <div className="text-3xl font-bold text-emerald-600">
                {freqData?.percentage || 0}%
              </div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-slate-500 mb-1">Presenças</div>
              <div className="text-3xl font-bold text-slate-800">
                {freqData?.presences || 0}
              </div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-slate-500 mb-1">Faltas</div>
              <div className="text-3xl font-bold text-red-600">
                {freqData?.absences || 0}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Histórico de Chamada</h3>
            </div>
            
            {freqData?.history && freqData.history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b">
                    <tr>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Dia</th>
                      <th className="px-4 py-3">Horário</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {freqData.history.map((record: any) => (
                      <tr key={record.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">
                          {format(parseISO(record.date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3">{daysMap[record.class.dayOfWeek]}</td>
                        <td className="px-4 py-3">{record.class.startTime}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {record.status === 'PRESENT' ? 'Presente' : 'Falta'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Nenhum registro de chamada neste mês.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

