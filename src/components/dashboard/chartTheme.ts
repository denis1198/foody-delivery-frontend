import type { Theme } from '../../theme/useTheme'

/**
 * Cores dos gráficos. Séries = slots 1–3 da paleta categórica de referência (azul, laranja, água),
 * validadas para daltonismo nos dois temas contra as superfícies do app. Eixos e grade recessivos.
 */
export const CHART_COLORS = {
  light: {
    series: ['#2a78d6', '#eb6834', '#1baf7a'],
    grid: '#ece8e2',
    axis: '#8b837a',
    ink: '#231f1b',
    surface: '#ffffff',
    border: '#e6e1da',
    muted: '#d8d2ca',
  },
  dark: {
    series: ['#3987e5', '#d95926', '#199e70'],
    grid: '#2c2824',
    axis: '#8b837a',
    ink: '#f3efe9',
    surface: '#1f1c19',
    border: '#35302b',
    muted: '#4a443e',
  },
} satisfies Record<Theme, unknown>

export function tooltipStyle(theme: Theme) {
  const c = CHART_COLORS[theme]
  return {
    contentStyle: {
      backgroundColor: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: 8,
      fontSize: 13,
      color: c.ink,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    },
    labelStyle: { color: c.ink, fontWeight: 600, marginBottom: 4 },
    itemStyle: { color: c.ink, padding: 0 },
  }
}
