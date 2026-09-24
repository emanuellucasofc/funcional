import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { UserPlus, Shield, User as UserIcon, Lock } from 'lucide-react'
import { useToast } from '../components/ui/Toast'

export default function UsersPage() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'INSTRUCTOR' })

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users')
      return res.data.users
    },
    enabled: isAdmin,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsModalOpen(false)
      setFormData({ name: '', email: '', password: '', role: 'INSTRUCTOR' })
      toast('success', 'Usuário criado com sucesso')
    },
    onError: () => toast('error', 'Não foi possível criar o usuário')
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => api.put(`/users/${id}`, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast('success', 'O status do usuário foi alterado.')
    }
  })

  if (!isAdmin) {
    return <div className="p-8 text-center text-slate-500">Acesso negado. Apenas administradores.</div>
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Gerenciamento de Usuários</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Carregando usuários...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase">Nome</th>
                <th className="px-6 py-4 font-semibold uppercase">Nível de Acesso</th>
                <th className="px-6 py-4 font-semibold uppercase">Status</th>
                <th className="px-6 py-4 font-semibold uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users?.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{u.name}</div>
                    <div className="text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {u.role === 'ADMIN' ? <Shield className="w-4 h-4 text-emerald-500" /> : <UserIcon className="w-4 h-4 text-slate-400" />}
                      <span className={u.role === 'ADMIN' ? 'text-emerald-700 font-medium' : 'text-slate-600'}>
                        {u.role === 'ADMIN' ? 'Administrador' : 'Instrutor'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Ativo' : 'Bloqueado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleStatusMutation.mutate({ id: u.id, isActive: u.isActive })}
                      className="text-slate-400 hover:text-slate-800 transition-colors"
                      title={u.isActive ? 'Bloquear usuário' : 'Desbloquear usuário'}
                    >
                      <Lock className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Novo Usuário (Staff)</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Nome</label>
                <input required className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input required type="email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="label">Senha</label>
                <input required type="password" minLength={6} className="input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div>
                <label className="label">Nível de Acesso</label>
                <select className="input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="INSTRUCTOR">Instrutor (Acesso Limitado)</option>
                  <option value="ADMIN">Administrador (Total)</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">Criar Usuário</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

