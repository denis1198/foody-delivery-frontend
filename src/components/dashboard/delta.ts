export interface Delta {
  /** Texto já formatado (ex.: "+12,4%" ou "+1,2 p.p."). */
  label: string
  direction: 'up' | 'down' | 'flat'
  /** Se subir é bom (faturamento) ou ruim (cancelamentos). */
  good: boolean
}

/** Variação percentual entre dois valores; nula quando não há base de comparação. */
export function percentDelta(current: number, previous: number, higherIsBetter = true): Delta | null {
  if (previous === 0) return null
  const change = ((current - previous) / Math.abs(previous)) * 100
  const rounded = Math.round(change * 10) / 10
  const direction = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat'
  return {
    label: `${rounded > 0 ? '+' : ''}${rounded.toLocaleString('pt-BR')}%`,
    direction,
    good: direction === 'up' ? higherIsBetter : !higherIsBetter,
  }
}

/** Variação em pontos percentuais (para margem). */
export function pointsDelta(current: number, previous: number): Delta {
  const diff = Math.round((current - previous) * 10) / 10
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat'
  return {
    label: `${diff > 0 ? '+' : ''}${diff.toLocaleString('pt-BR')} p.p.`,
    direction,
    good: direction === 'up',
  }
}
