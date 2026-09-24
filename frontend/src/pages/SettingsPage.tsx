import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'

export default function SettingsPage() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings')
      return res.data.settings
    },
  })

  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    if (data) reset(data)
  }, [data])

  const mutation = useMutation({
    mutationFn: (values: any) => api.put('/settings', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast('success', 'Configurações salvas com sucesso!')
    },
    onError: () => toast('error', 'Erro ao salvar configurações.'),
  })

  if (!isAdmin) {
    return (
      <div className="card text-center py-16">
        <p className="text-slate-500">Apenas administradores podem acessar as configurações.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        <div className="card space-y-4">
          <h3 className="font-semibold text-slate-800">Dados da Empresa</h3>
          <div>
            <label className="label">Nome da empresa</label>
            <input {...register('companyName')} className="input" />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input {...register('companyPhone')} className="input" placeholder="(21) 99999-9999" />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input {...register('companyEmail')} type="email" className="input" />
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-slate-800">Regras de Alerta de Faltas</h3>
          <p className="text-sm text-slate-500">Configure quantas faltas por mês ativam cada nível de alerta.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">👀 Atenção</label>
              <input {...register('warningAbsences', { valueAsNumber: true })} type="number" min={1} className="input" />
            </div>
            <div>
              <label className="label">⚠️ Alerta</label>
              <input {...register('alertAbsences', { valueAsNumber: true })} type="number" min={1} className="input" />
            </div>
            <div>
              <label className="label">🚨 Crítico</label>
              <input {...register('criticalAbsences', { valueAsNumber: true })} type="number" min={1} className="input" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Configurações
        </button>
      </form>
    </div>
  )
}
