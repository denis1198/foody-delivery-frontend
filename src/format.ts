import type { OrderStatus } from './api/types'

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
  EM_PREPARO: 'Iniciar preparo',
  SAIU_PARA_ENTREGA: 'Enviar para entrega',
  ENTREGUE: 'Marcar como entregue',
  CANCELADO: 'Cancelar',
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export const formatMoney = (value: number) => currency.format(value)
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))
