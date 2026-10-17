import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Delta } from './delta'

/** Card de KPI no padrão do Manager, com variação contra o período anterior. */
export function StatCard({
  icon: Icon,
  label,
  value,
  tooltip,
  delta,
  loading,
}: {
  icon: LucideIcon
  label: string
  value: string
  tooltip?: ReactNode
  delta?: Delta | null
  loading?: boolean
}) {
  const DeltaIcon = delta?.direction === 'up' ? ArrowUpRight : delta?.direction === 'down' ? ArrowDownRight : Minus
  const tone =
    !delta || delta.direction === 'flat' ? 'text-ink-muted' : delta.good ? 'text-success' : 'text-danger'

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 shadow-card">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate text-xs text-ink-muted">{label}</p>
          {tooltip}
        </div>
        <p className="truncate text-xl font-semibold text-ink">{loading ? '…' : value}</p>
        {delta && !loading && (
          <p className={`flex items-center gap-0.5 text-xs font-medium ${tone}`} title="Comparado ao período anterior de mesmo tamanho">
            <DeltaIcon size={13} />
            {delta.label}
            <span className="ml-1 font-normal text-ink-muted">vs. anterior</span>
          </p>
        )}
      </div>
    </div>
  )
}
