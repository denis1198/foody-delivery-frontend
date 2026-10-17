import { ArrowLeft, MapPin, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { ApiError } from '../../api/client'
import { customerApi } from '../../api/orders'
import type { Order } from '../../api/types'
import { OrderTimeline } from '../../components/OrderTimeline'
import { formatDateTime, formatMoney, PAYMENT_LABELS } from '../../format'

const REFRESH_MS = 10_000

export function MyOrderDetailPage() {
  const id = Number(useParams().id)
  const justCreated = (useLocation().state as { created?: boolean } | null)?.created
  const [result, setResult] = useState<{ id: number; order?: Order; error?: string } | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Atualiza sozinho enquanto o pedido está em andamento, para o cliente acompanhar o status.
  useEffect(() => {
    let active = true
    const load = () =>
      customerApi
        .order(id)
        .then((order) => active && setResult({ id, order }))
        .catch((err) =>
          active && setResult({ id, error: err instanceof ApiError ? err.message : 'Erro ao carregar o pedido.' }),
        )
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [id])

  async function cancel() {
    if (!window.confirm('Cancelar este pedido?')) return
    setCancelling(true)
    setActionError(null)
    try {
      setResult({ id, order: await customerApi.cancel(id) })
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Erro ao cancelar.')
    } finally {
      setCancelling(false)
    }
  }

  const back = (
    <Link to="/meus-pedidos" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-accent">
      <ArrowLeft size={16} /> Meus pedidos
    </Link>
  )

  if (!result || result.id !== id) return <>{back}<p className="py-12 text-center text-sm text-ink-muted">Carregando…</p></>
  if (!result.order) return <>{back}<p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result.error}</p></>

  const order = result.order
  const a = order.deliveryAddress
  return (
    <div className="mx-auto max-w-3xl">
      {back}
      {justCreated && (
        <p className="mb-4 rounded-lg bg-success-soft px-4 py-3 text-sm font-medium text-success">
          Pedido enviado! O restaurante já foi avisado. 🎉
        </p>
      )}

      <section className="card mb-4 p-5">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-2xl">{order.restaurant.logoEmoji}</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-ink">{order.restaurant.name}</h1>
            <p className="text-sm text-ink-muted">
              Pedido #{order.id} · {formatDateTime(order.createdAt)}
            </p>
          </div>
          {order.nextStatuses.includes('CANCELADO') && (
            <button type="button" className="btn btn-danger btn-sm" onClick={cancel} disabled={cancelling}>
              {cancelling ? 'Cancelando…' : 'Cancelar pedido'}
            </button>
          )}
        </div>
        <OrderTimeline status={order.status} />
        {actionError && <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{actionError}</p>}
      </section>

      <div className="grid gap-4 md:grid-cols-[1fr_260px]">
        <section className="card p-5">
          <h2 className="mb-3 font-semibold text-ink">Itens</h2>
          <ul className="divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 py-2.5 text-sm">
                <span className="text-ink">
                  <span className="font-semibold">{item.quantity}×</span> {item.productName}
                  {item.notes && <span className="block text-xs text-ink-muted italic">Obs.: {item.notes}</span>}
                </span>
                <span className="shrink-0 text-ink">{formatMoney(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-ink-muted">
              <dt>Subtotal</dt>
              <dd>{formatMoney(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-ink-muted">
              <dt>Taxa de entrega</dt>
              <dd>{formatMoney(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold text-ink">
              <dt>Total</dt>
              <dd>{formatMoney(order.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="flex flex-col gap-4">
          <section className="card p-5 text-sm">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-ink">
              <MapPin size={16} className="text-accent" /> Entrega
            </h2>
            <p className="text-ink">
              {a.street}, {a.number}
              {a.complement && ` — ${a.complement}`}
            </p>
            <p className="text-ink-muted">
              {a.neighborhood}, {a.city} · {a.zipCode}
            </p>
          </section>
          <section className="card p-5 text-sm">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-ink">
              <Wallet size={16} className="text-accent" /> Pagamento
            </h2>
            <p className="text-ink">{PAYMENT_LABELS[order.paymentMethod]}</p>
            {order.notes && <p className="mt-2 text-ink-muted italic">“{order.notes}”</p>}
          </section>
        </div>
      </div>
    </div>
  )
}
