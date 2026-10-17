import { useState } from 'react'
import { ApiError } from '../api/client'
import { ordersApi } from '../api/orders'
import type { Order, OrderStatus } from '../api/types'
import { STATUS_ACTIONS } from '../format'

interface Props {
  order: Order
  onUpdated: (order: Order) => void
}

/** Botões com as próximas transições válidas que o backend informa em `nextStatuses`. */
export function StatusActions({ order, onUpdated }: Props) {
  const [pending, setPending] = useState<OrderStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (order.nextStatuses.length === 0) return null

  async function change(status: OrderStatus) {
    if (status === 'CANCELADO' && !window.confirm(`Cancelar o pedido #${order.id}?`)) return
    setPending(status)
    setError(null)
    try {
      onUpdated(await ordersApi.updateStatus(order.id, status))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao atualizar status.')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="status-actions">
      {order.nextStatuses.map((status) => (
        <button
          key={status}
          className={`btn btn-sm ${status === 'CANCELADO' ? 'btn-danger' : 'btn-primary'}`}
          disabled={pending !== null}
          onClick={() => change(status)}
        >
          {pending === status ? 'Salvando…' : STATUS_ACTIONS[status]}
        </button>
      ))}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
