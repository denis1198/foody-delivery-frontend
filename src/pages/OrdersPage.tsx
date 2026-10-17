import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { ordersApi } from '../api/orders'
import { ORDER_STATUSES, type Order, type OrderStatus } from '../api/types'
import { StatusActions } from '../components/StatusActions'
import { StatusBadge } from '../components/StatusBadge'
import { STATUS_LABELS, formatDateTime, formatMoney } from '../format'

const REFRESH_INTERVAL_MS = 15_000

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<OrderStatus | 'TODOS'>('TODOS')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Carrega ao abrir e atualiza periodicamente para refletir mudanças de outros usuários.
  useEffect(() => {
    let active = true
    const fetchOrders = () =>
      ordersApi
        .list()
        .then((data) => {
          if (!active) return
          setOrders(data)
          setError(null)
        })
        .catch((err) => active && setError(err instanceof ApiError ? err.message : 'Erro ao carregar pedidos.'))
        .finally(() => active && setLoading(false))

    fetchOrders()
    const timer = setInterval(fetchOrders, REFRESH_INTERVAL_MS)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [refreshKey])

  const replaceOrder = (updated: Order) =>
    setOrders((current) => current.map((o) => (o.id === updated.id ? updated : o)))

  const countBy = (status: OrderStatus) => orders.filter((o) => o.status === status).length
  const visible = filter === 'TODOS' ? orders : orders.filter((o) => o.status === filter)

  return (
    <>
      <div className="page-header">
        <h1>Pedidos</h1>
        <div className="toolbar">
          <button className="btn btn-ghost" onClick={() => setRefreshKey((k) => k + 1)}>
            Atualizar
          </button>
          <Link to="/pedidos/novo" className="btn btn-primary">
            + Novo pedido
          </Link>
        </div>
      </div>

      <div className="filters" role="tablist">
        <FilterChip active={filter === 'TODOS'} onClick={() => setFilter('TODOS')}>
          Todos <span className="count">{orders.length}</span>
        </FilterChip>
        {ORDER_STATUSES.map((status) => (
          <FilterChip key={status} active={filter === status} onClick={() => setFilter(status)}>
            {STATUS_LABELS[status]} <span className="count">{countBy(status)}</span>
          </FilterChip>
        ))}
      </div>

      {error && <p className="alert">{error}</p>}

      {loading ? (
        <p className="center muted">Carregando pedidos…</p>
      ) : visible.length === 0 ? (
        <div className="card center">
          <p className="muted">
            {orders.length === 0 ? 'Nenhum pedido cadastrado ainda.' : 'Nenhum pedido com este status.'}
          </p>
          {orders.length === 0 && (
            <Link to="/pedidos/novo" className="btn btn-primary">
              Criar o primeiro pedido
            </Link>
          )}
        </div>
      ) : (
        <div className="order-grid">
          {visible.map((order) => (
            <OrderCard key={order.id} order={order} onUpdated={replaceOrder} />
          ))}
        </div>
      )}
    </>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button role="tab" aria-selected={active} className={`chip ${active ? 'chip-active' : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}

function OrderCard({ order, onUpdated }: { order: Order; onUpdated: (order: Order) => void }) {
  const { deliveryAddress: a } = order
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <article className="card order-card">
      <header className="order-card-header">
        <Link to={`/pedidos/${order.id}`} className="order-id">
          #{order.id}
        </Link>
        <StatusBadge status={order.status} />
      </header>
      <div>
        <strong>{order.customerName}</strong>
        <p className="muted small">
          {a.street}, {a.number} — {a.neighborhood}, {a.city}
        </p>
      </div>
      <ul className="item-list small">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.quantity}× {item.productName}
          </li>
        ))}
      </ul>
      <div className="order-card-footer">
        <span className="muted small">
          {itemCount} {itemCount === 1 ? 'item' : 'itens'} · {formatDateTime(order.createdAt)}
        </span>
        <strong>{formatMoney(order.total)}</strong>
      </div>
      <StatusActions order={order} onUpdated={onUpdated} />
    </article>
  )
}
