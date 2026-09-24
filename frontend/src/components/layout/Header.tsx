import { Bell, Menu, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

interface HeaderProps {
  onMenuClick: () => void
  title: string
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: alertCount } = useQuery({
    queryKey: ['alerts-count'],
    queryFn: async () => {
      const res = await api.get('/alerts/count')
      return res.data.count as number
    },
    refetchInterval: 60000,
  })

  return (
    <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-500 hover:text-slate-700"
      >
        <Menu className="w-6 h-6" />
      </button>

      <h1 className="text-lg font-semibold text-slate-800 flex-1">{title}</h1>

      <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-64">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar aluno..."
          className="bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && search.trim()) {
              navigate(`/alunos?search=${encodeURIComponent(search)}`)
              setSearch('')
            }
          }}
        />
      </div>

      <button
        onClick={() => navigate('/alertas')}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
      >
        <Bell className="w-5 h-5" />
        {alertCount && alertCount > 0 ? (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {alertCount > 9 ? '9+' : alertCount}
          </span>
        ) : null}
      </button>
    </header>
  )
}
