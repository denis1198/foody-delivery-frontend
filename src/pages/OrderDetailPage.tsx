import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { ordersApi } from '../api/orders'
import type { Order } from '../api/types'
import { StatusActions } from '../components/StatusActions'
import { StatusBadge } from '../components/StatusBadge'
import { formatDateTime, formatMoney } from '../format'

export function OrderDetailPage() {
  const id = Number(useParams().id)
  const justCreated = (useLocation().state as { created?: boolean } | null)?.created
  const [result, setResult] = useState<{ id: number; order?: Order; error?: string } | null>(null)

  useEffect(() => {
    let active = true
    ordersApi
      .get(id)
      .then((order) => active && setResult({ id, order }))
      .catch((err) =>
        active && setResult({ id, error: err instanceof ApiError ? err.message : 'Erro ao carregar o pedido.' }),
      )
    return () => {
      active = false
    }
  }, [id])

  const header = (
    <div className="page-header">
      <h1>Pedido #{Number.isFinite(id) ? id : '?'}</h1>
      <Link to="/" className="btn btn-ghost">
        Voltar para pedidos
      </Link>
    </div>
  )

  if (!result || result.id !== id) return <>{header}<p className="center muted">Carregando…</p></>
  if (!result.order) return <>{header}<p className="alert">{result.error}</p></>

  const order = result.order
  const a = order.deliveryAddress

  return (
    <>
      {header}
      {justCreated && <p className="success">Pedido criado com sucesso!</p>}

      <div className="detail-grid">
        <section className="card">
          <div className="order-card-header">
            <h2>Status</h2>
            <StatusBadge status={order.status} />
          </div>
          <dl className="details">
            <dt>Criado em</dt>
            <dd>{formatDateTime(order.createdAt)}</dd>
            <dt>Última atualização</dt>
            <dd>{formatDateTime(order.updatedAt)}</dd>
            <dt>Registrado por</dt>
            <dd>{order.createdBy}</dd>
          </dl>
          <StatusActions order={order} onUpdated={(updated) => setResult({ id, order: updated })} />
        </section>

        <section className="card">
          <h2>Cliente e entrega</h2>
          <p>
            <strong>{order.customerName}</strong>
          </p>
          <p className="muted">
            {a.street}, {a.number}
            {a.complement && ` — ${a.complement}`}
            <br />
            {a.neighborhood} · {a.city}
            <br />
            CEP {a.zipCode}
          </p>
        </section>
      </div>

      <section className="card">
        <h2>Itens</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th className="num">Qtd.</th>
                <th className="num">Preço unit.</th>
                <th className="num">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.productName}</td>
                  <td className="num">{item.quantity}</td>
                  <td className="num">{formatMoney(item.unitPrice)}</td>
                  <td className="num">{formatMoney(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Total</td>
                <td className="num">{formatMoney(order.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </>
  )
}
