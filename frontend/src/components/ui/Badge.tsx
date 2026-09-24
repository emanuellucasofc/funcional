import { cn } from '../../lib/utils'
import { StudentStatus, AlertType } from '../../types'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gray'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        variant === 'success' && 'bg-emerald-100 text-emerald-700',
        variant === 'warning' && 'bg-amber-100 text-amber-700',
        variant === 'danger' && 'bg-red-100 text-red-700',
        variant === 'gray' && 'bg-slate-100 text-slate-600',
        variant === 'default' && 'bg-blue-100 text-blue-700',
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: StudentStatus }) {
  const variants = {
    ACTIVE: { variant: 'success' as const, label: 'Ativo', dot: '🟢' },
    INACTIVE: { variant: 'gray' as const, label: 'Inativo', dot: '⚫' },
    LOCKED: { variant: 'warning' as const, label: 'Trancado', dot: '🟡' },
  }
  const { variant, label, dot } = variants[status]
  return <Badge variant={variant}>{dot} {label}</Badge>
}

export function AlertBadge({ type }: { type: AlertType }) {
  const variants = {
    WARNING: { variant: 'warning' as const, label: 'Atenção' },
    ALERT: { variant: 'danger' as const, label: 'Alerta' },
    CRITICAL: { variant: 'danger' as const, label: 'Crítico' },
  }
  const { variant, label } = variants[type]
  return <Badge variant={variant}>{label}</Badge>
}
