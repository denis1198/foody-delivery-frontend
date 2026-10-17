/** Presets de período no padrão do Marketplace Manager, com datas no fuso de Brasília. */
export const PERIOD_PRESETS = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '15', label: 'Últimos 15 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '60', label: 'Últimos 60 dias' },
  { value: 'month', label: 'Este mês' },
  { value: 'lastMonth', label: 'Mês passado' },
  { value: 'custom', label: 'Personalizado' },
] as const

export type PeriodPreset = (typeof PERIOD_PRESETS)[number]['value']
export interface DateRange {
  from: string
  to: string
}

/** Data de hoje (YYYY-MM-DD) em Brasília, independente do fuso do navegador. */
export function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + delta))
  return date.toISOString().slice(0, 10)
}

/**
 * Converte o preset em intervalo inclusivo. "Últimos N dias" termina ontem, como no Manager:
 * só dias completos, para as comparações entre dias serem justas.
 */
export function resolvePeriod(preset: PeriodPreset, custom: DateRange): DateRange {
  const today = todayLocal()
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case 'yesterday':
      return { from: addDays(today, -1), to: addDays(today, -1) }
    case 'month':
      return { from: `${today.slice(0, 7)}-01`, to: today }
    case 'lastMonth': {
      const firstThisMonth = `${today.slice(0, 7)}-01`
      const lastDayPrev = addDays(firstThisMonth, -1)
      return { from: `${lastDayPrev.slice(0, 7)}-01`, to: lastDayPrev }
    }
    case 'custom':
      return custom
    default: {
      const n = Number(preset)
      return { from: addDays(today, -n), to: addDays(today, -1) }
    }
  }
}
