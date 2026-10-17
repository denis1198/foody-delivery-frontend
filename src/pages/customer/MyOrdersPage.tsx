import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../../api/client'
import { customerApi } from '../../api/orders'
import type { Order } from '../../api/types'
import { StatusBadge } from '../../components/StatusBadge'
import { formatDateTime, formatMoney } from '../../format'

const REFRESH_MS = 15_000

export function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = () =>
      customerApi
        .myOrders()
        .then((data) => active && setOrders(data))
        .catch((err) => active && setError(err instanceof ApiError ? err.message : 'Erro ao carregar pedidos.'))
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  const inProgress = orders?.filter((o) => o.status !== 'ENTREGUE' && o.status !== 'CANCELADO') ?? []
  const past = orders?.filter((o) => !inProgress.includes(o)) ?? []

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-ink">Meus pedidos</h1>
      {error && <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      {orders === null ? (
        <p className="py-12 text-center text-sm text-ink-muted">Carregando…</p>
      ) : orders.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="text-ink-muted">Você ainda não fez nenhum pedido.</p>
          <Link to="/" className="btn btn-primary mt-4">
            Escolher um restaurante
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {inProgress.length > 0 && <OrderList title="Em andamento" orders={inProgress} highlight />}
          {past.length > 0 && <OrderList title="Anteriores" orders={past} />}
        </div>
      )}
    </>
  )
}

function OrderList({ title, orders, highlight }: { title: string; orders: Order[]; highlight?: boolean }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold tracking-wider text-ink-muted uppercase">{title}</h2>
      <ul className="flex flex-col gap-3">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              to={`/meus-pedidos/${order.id}`}
              className={`card flex items-center gap-4 p-4 transition-colors hover:border-accent/50 ${highlight ? 'border-accent/40' : ''}`}
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-2xl">
                {order.restaurant.logoEmoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{order.restaurant.name}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="truncate text-sm text-ink-muted">
                  {order.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
                </p>
                <p className="text-xs text-ink-muted">
                  Pedido #{order.id} · {formatDateTime(order.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-semibold text-ink">{formatMoney(order.total)}</span>
                <ChevronRight size={18} className="text-ink-muted" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
