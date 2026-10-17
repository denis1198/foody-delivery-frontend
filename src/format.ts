import type { OrderStatus, PaymentMethod } from './api/types'

export const STATUS_LABELS: Record<OrderStatus, string> = {
  RECEBIDO: 'Recebido',
  EM_PREPARO: 'Em preparo',
  SAIU_PARA_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}

/** Rótulo do botão que leva o pedido para o status indicado. */
export const STATUS_ACTIONS: Record<OrderStatus, string> = {
  RECEBIDO: 'Receber',
  EM_PREPARO: 'Aceitar e preparar',
  SAIU_PARA_ENTREGA: 'Despachar',
  ENTREGUE: 'Confirmar entrega',
  CANCELADO: 'Cancelar',
}

/** Classes de cor (fundo suave + texto) por status, usando os tokens do tema. */
export const STATUS_STYLES: Record<OrderStatus, string> = {
  RECEBIDO: 'bg-info-soft text-info',
  EM_PREPARO: 'bg-warning-soft text-warning',
  SAIU_PARA_ENTREGA: 'bg-violet-soft text-violet',
  ENTREGUE: 'bg-success-soft text-success',
  CANCELADO: 'bg-surface-alt text-ink-muted line-through',
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  PIX: 'Pix',
  CARTAO: 'Cartão',
  DINHEIRO: 'Dinheiro',
}

export const RESTAURANT_CATEGORIES = [
  { name: 'Pizzaria', emoji: '🍕' },
  { name: 'Lanches', emoji: '🍔' },
  { name: 'Japonesa', emoji: '🍣' },
  { name: 'Brasileira', emoji: '🍲' },
  { name: 'Doces', emoji: '🍰' },
  { name: 'Saudável', emoji: '🥗' },
  { name: 'Árabe', emoji: '🥙' },
  { name: 'Açaí', emoji: '🍇' },
]

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const compactCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const time = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' })

export const formatMoney = (value: number) => currency.format(value)
export const formatMoneyCompact = (value: number) => compactCurrency.format(value)
export const formatNumber = (value: number) => number.format(value)
export const formatPercent = (value: number) => `${number.format(value)}%`
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))
export const formatTime = (iso: string) => time.format(new Date(iso))

/** "2026-10-15" → "qua., 15/10" sem conversão de fuso (a data já é local). */
export function formatDay(day: string, withWeekday = true) {
  const [y, m, d] = day.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const short = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
  if (!withWeekday) return short
  return `${date.toLocaleDateString('pt-BR', { weekday: 'short' })}, ${short}`
}

/** Minutos desde a data, para o quadro de pedidos ("há 12 min"). */
export function minutesSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000))
}
