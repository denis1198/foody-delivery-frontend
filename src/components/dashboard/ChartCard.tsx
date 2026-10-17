import type { ReactNode } from 'react'

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  height = 'h-64',
}: {
  title: string
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  height?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={height}>{children}</div>
    </div>
  )
}
