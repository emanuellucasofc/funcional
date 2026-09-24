import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Save, ArrowLeft, Trash2 } from 'lucide-react'
import { useToast } from '../components/ui/Toast'
import { differenceInYears, parseISO } from 'date-fns'

const studentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  birthDate: z.string().optional(),
  age: z.coerce.number().optional().nullable(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  education: z.string().optional(),
  weight: z.coerce.number().optional().nullable(),
  height: z.coerce.number().optional().nullable(),
  hasHealthIssues: z.boolean().default(false),
  healthIssuesDetails: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']),
  notes: z.string().optional(),
  classIds: z.array(z.string()).default([]),
})

type StudentFormValues = z.infer<typeof studentSchema>

export default function StudentFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isEditing = Boolean(id)

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/classes')
      return res.data.classes
    },
  })

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      if (!isEditing) return null
      const res = await api.get(`/students/${id}`)
      return res.data.student
    },
    enabled: isEditing,
  })

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      cpf: '',
      email: '',
      phone: '',
      emergencyContact: '',
      birthDate: '',
      age: undefined,
      address: '',
      city: '',
      state: '',
      education: '',
      weight: undefined,
      height: undefined,
      hasHealthIssues: false,
      healthIssuesDetails: '',
      status: 'ACTIVE',
      notes: '',
      classIds: [],
    },
  })

  const hasHealthIssues = form.watch('hasHealthIssues')
  const birthDateValue = form.watch('birthDate')

  useEffect(() => {
    if (birthDateValue) {
      const parsed = parseISO(birthDateValue)
      if (!isNaN(parsed.getTime())) {
        const calculatedAge = differenceInYears(new Date(), parsed)
        // Só sobrescreve a idade se não for edição ou se a pessoa acabou de digitar a data
        form.setValue('age', calculatedAge)
      }
    }
  }, [birthDateValue, form])

  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name,
        cpf: student.cpf || '',
        email: student.email || '',
        phone: student.phone || '',
        emergencyContact: student.emergencyContact || '',
        birthDate: student.birthDate ? student.birthDate.split('T')[0] : '',
        age: student.age || undefined,
        address: student.address || '',
        city: student.city || '',
        state: student.state || '',
        education: student.education || '',
        weight: student.weight || undefined,
        height: student.height || undefined,
        hasHealthIssues: student.hasHealthIssues || false,
        healthIssuesDetails: student.healthIssuesDetails || '',
        status: student.status,
        notes: student.notes || '',
        classIds: student.studentClasses.map((sc: any) => sc.classId),
      })
    }
  }, [student, form])

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Remove null values so backend can handle them appropriately if needed
      if (isEditing) {
        await api.put(`/students/${id}`, data)
      } else {
        await api.post('/students', data)
      }
    },
    onSuccess: () => {
      toast('success', `Aluno ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso.`)
      queryClient.invalidateQueries({ queryKey: ['students'] })
      navigate('/alunos')
    },
    onError: (err: any) => {
      toast('error', err.response?.data?.details ? JSON.stringify(err.response.data.details) : (err.response?.data?.error || 'Ocorreu um erro'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/students/${id}`)
    },
    onSuccess: () => {
      toast('success', 'Aluno excluído com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['students'] })
      navigate('/alunos')
    },
    onError: (err: any) => {
      console.error(err)
      toast('error', 'Ocorreu um erro ao excluir o aluno.')
    }
  })

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) {
      deleteMutation.mutate()
    }
  }

  const onSubmit = (data: StudentFormValues) => {
    const payload = {
      ...data,
      email: data.email || null,
      cpf: data.cpf || null,
      phone: data.phone || null,
      emergencyContact: data.emergencyContact || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      education: data.education || null,
      healthIssuesDetails: data.healthIssuesDetails || null,
      notes: data.notes || null,
      birthDate: data.birthDate || null,
      age: data.age || null,
      weight: data.weight || null,
      height: data.height || null,
    }
    mutation.mutate(payload)
  }

  if (isLoading) return <div>Carregando...</div>

  const daysMap: Record<string, string> = {
    MONDAY: 'Segunda', TUESDAY: 'Terça', WEDNESDAY: 'Quarta',
    THURSDAY: 'Quinta', FRIDAY: 'Sexta', SATURDAY: 'Sábado', SUNDAY: 'Domingo',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEditing ? 'Editar Aluno' : 'Novo Aluno'}
          </h1>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="p-2 px-4 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors flex items-center gap-2 font-medium border border-transparent hover:border-red-200"
          >
            <Trash2 className="w-5 h-5" />
            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir Aluno'}
          </button>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Dados Pessoais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="label">Nome Completo *</label>
              <input {...form.register('name')} className="input" placeholder="Ex: João da Silva" />
              {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="label">Status</label>
              <select {...form.register('status')} className="input">
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
                <option value="LOCKED">Bloqueado</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="label">CPF</label>
              <input {...form.register('cpf')} className="input" placeholder="000.000.000-00" />
            </div>

            <div className="space-y-1">
              <label className="label">E-mail</label>
              <input {...form.register('email')} type="email" className="input" placeholder="Ex: joao@email.com" />
            </div>

            <div className="space-y-1">
              <label className="label">Telefone Principal</label>
              <input {...form.register('phone')} className="input" placeholder="Ex: (11) 99999-9999" />
            </div>

            <div className="space-y-1">
              <label className="label">Telefone de Emergência</label>
              <input {...form.register('emergencyContact')} className="input" placeholder="Ex: (11) 99999-9999" />
            </div>

            <div className="space-y-1">
              <label className="label">Data de Nascimento</label>
              <input {...form.register('birthDate')} type="date" className="input" />
            </div>

            <div className="space-y-1">
              <label className="label">Idade</label>
              <input {...form.register('age')} type="number" className="input" placeholder="Ex: 25" />
            </div>

            <div className="space-y-1">
              <label className="label">Escolaridade</label>
              <input {...form.register('education')} className="input" placeholder="Ex: Superior Incompleto" />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Endereço e Saúde</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="label">Endereço Completo</label>
              <input {...form.register('address')} className="input" placeholder="Rua, Número, Bairro" />
            </div>
            <div className="space-y-1">
              <label className="label">Cidade</label>
              <input {...form.register('city')} className="input" placeholder="Ex: São Paulo" />
            </div>
            <div className="space-y-1">
              <label className="label">UF (Estado)</label>
              <input {...form.register('state')} className="input" placeholder="Ex: SP" maxLength={2} />
            </div>
            <div className="space-y-1">
              <label className="label">Peso (kg)</label>
              <input {...form.register('weight')} type="number" step="0.1" className="input" placeholder="Ex: 75.5" />
            </div>
            <div className="space-y-1">
              <label className="label">Altura (m)</label>
              <input {...form.register('height')} type="number" step="0.01" className="input" placeholder="Ex: 1.75" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" {...form.register('hasHealthIssues')} className="w-5 h-5 text-emerald-600 rounded border-slate-300" />
              <span className="font-medium text-slate-800">Possui problema de saúde?</span>
            </label>
            
            {hasHealthIssues && (
              <div className="mt-6 space-y-1">
                <label className="label">Qual problema de saúde?</label>
                <textarea 
                  {...form.register('healthIssuesDetails')} 
                  className="input min-h-24" 
                  placeholder="Descreva o problema de saúde e restrições..."
                />
              </div>
            )}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Observações Gerais</h2>
          <div className="space-y-1">
            <label className="label">Observações</label>
            <textarea 
              {...form.register('notes')} 
              className="input min-h-24" 
              placeholder="Anotações gerais sobre o aluno..."
            />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Matrícula em Turmas (Horários)</h2>
          <p className="text-sm text-slate-500 mb-4">Selecione os horários que este aluno frequenta:</p>
          
          <Controller
            name="classIds"
            control={form.control}
            render={({ field }) => {
              const groupedClasses = (() => {
                if (!classesData) return []
                const map = new Map<string, any>()
                for (const cls of classesData) {
                  const key = `${cls.startTime}-${cls.endTime}`
                  if (!map.has(key)) {
                    map.set(key, {
                      id: key,
                      name: cls.name,
                      startTime: cls.startTime,
                      endTime: cls.endTime,
                      classes: []
                    })
                  }
                  map.get(key).classes.push(cls)
                }
                return Array.from(map.values())
              })()

              return (
                <div className="space-y-4">
                  {groupedClasses.map((group) => (
                    <div key={group.id} className="p-4 border rounded-xl border-slate-200 bg-white">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-semibold text-slate-800">{group.startTime} Ã s {group.endTime}</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {group.classes.map((cls: any) => {
                          const isSelected = field.value.includes(cls.id)

                          const handleChange = (checked: boolean) => {
                            if (checked) {
                              field.onChange([...field.value, cls.id])
                            } else {
                              field.onChange(field.value.filter((id: string) => id !== cls.id))
                            }
                          }

                          return (
                            <label key={cls.id} className={`flex items-center space-x-2 p-2 px-3 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'hover:bg-slate-50 border-slate-200 text-slate-700'}`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleChange(e.target.checked)}
                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                              />
                              <span className="font-medium text-sm">{daysMap[cls.dayOfWeek]}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  {groupedClasses.length === 0 && (
                    <div className="text-slate-500 text-sm italic">
                      Nenhuma turma cadastrada. Crie uma turma primeiro.
                    </div>
                  )}
                </div>
              )
            }}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/alunos')}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending ? 'Salvando...' : 'Salvar Aluno'}
          </button>
        </div>
      </form>
    </div>
  )
}



