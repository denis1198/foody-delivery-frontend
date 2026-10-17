import { CalendarDays } from 'lucide-react'
import { formatDay } from '../../format'
import { PERIOD_PRESETS, todayLocal, type DateRange, type PeriodPreset } from '../../utils/period'

interface Props {
  preset: PeriodPreset
  custom: DateRange
  resolved: DateRange
  onPresetChange: (preset: PeriodPreset) => void
  onCustomChange: (range: DateRange) => void
}

/** Seletor de período em pílula com o intervalo resolvido ao lado, como no Manager. */
export function PeriodFilter({ preset, custom, resolved, onPresetChange, onCustomChange }: Props) {
  const today = todayLocal()
  const label =
    resolved.from === resolved.to
      ? formatDay(resolved.from)
      : `${formatDay(resolved.from, false)} – ${formatDay(resolved.to, false)}`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative flex items-center">
        <CalendarDays size={15} className="pointer-events-none absolute left-3 text-accent" />
        <select
          className="h-9 appearance-none rounded-full border border-border bg-surface pr-8 pl-9 text-sm font-medium text-ink outline-none focus:border-accent"
          value={preset}
          onChange={(e) => onPresetChange(e.target.value as PeriodPreset)}
          aria-label="Período"
        >
          {PERIOD_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 text-xs text-ink-muted">▾</span>
      </label>

      {preset === 'custom' ? (
        <div className="flex items-center gap-1.5 text-sm">
          <input
            type="date"
            className="input h-9 w-auto py-1"
            value={custom.from}
            max={custom.to || today}
            onChange={(e) => onCustomChange({ ...custom, from: e.target.value })}
            aria-label="Data inicial"
          />
          <span className="text-ink-muted">até</span>
          <input
            type="date"
            className="input h-9 w-auto py-1"
            value={custom.to}
            min={custom.from}
            max={today}
            onChange={(e) => onCustomChange({ ...custom, to: e.target.value })}
            aria-label="Data final"
          />
        </div>
      ) : (
        <span className="text-sm text-ink-muted">{label}</span>
      )}
    </div>
  )
}
