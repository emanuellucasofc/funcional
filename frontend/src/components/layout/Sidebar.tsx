import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarDays,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  FileText,
  Settings,
  Shield,
  LogOut,
  Dumbbell,
  X,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/alunos', icon: Users, label: 'Alunos' },
  { to: '/turmas', icon: Calendar, label: 'Turmas e Horários' },
  { to: '/calendario', icon: CalendarDays, label: 'Calendário' },
  { to: '/chamada', icon: ClipboardList, label: 'Lista de Chamada' },
  { to: '/frequencia', icon: BarChart3, label: 'Frequência' },
  { to: '/alertas', icon: AlertTriangle, label: 'Alertas' },
  { to: '/relatorios', icon: FileText, label: 'Relatórios' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
  { to: '/usuarios', icon: Shield, label: 'Acessos' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-72 bg-emerald-950 z-30 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex-1 flex items-center justify-center bg-white rounded-lg p-1.5 h-16 overflow-hidden mr-3 lg:mr-0">
            <img src="/logo.png" alt="Funcional Laranjeiras" className="w-full h-full object-contain mix-blend-multiply" />
          </div>
          <button onClick={onClose} className="lg:hidden text-emerald-100 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-100/70 hover:bg-white/10 hover:text-white transition-all duration-200',
                  isActive && 'bg-orange-500/15 text-orange-500 font-medium'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 pb-6 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-9 h-9 bg-orange-500/20 rounded-full flex items-center justify-center">
              <span className="text-orange-500 font-semibold text-sm">
                {user?.name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-emerald-100/70 text-xs capitalize">
                {user?.role === 'ADMIN' ? 'Administrador' : 'Instrutor'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-emerald-100/70 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>
    </>
  )
}

