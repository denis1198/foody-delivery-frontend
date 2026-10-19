import { Bell, ChevronLeft, ChevronRight, Clock, MapPin, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ApiError } from '../../api/client'
import { sellerApi } from '../../api/seller'
import type { Order, OrderStatus } from '../../api/types'
import { PeriodFilter } from '../../components/dashboard/PeriodFilter'
import { StatusBadge } from '../../components/StatusBadge'
import {
  formatDateTime,
  formatMoney,
  formatNumber,
  formatTime,
  minutesSince,
  PAYMENT_LABELS,
  STATUS_ACTIONS,
  STATUS_LABELS,
} from '../../format'
import { addDays, resolvePeriod, todayLocal, type DateRange, type PeriodPreset } from '../../utils/period'

const REFRESH_MS = 10_000

const COLUMNS: { title: string; statuses: OrderStatus[]; tone: string }[] = [
  { title: 'Novos', statuses: ['RECEBIDO'], tone: 'bg-info' },
  { title: 'Em preparo', statuses: ['EM_PREPARO'], tone: 'bg-warning' },
  { title: 'Saiu para entrega', statuses: ['SAIU_PARA_ENTREGA'], tone: 'bg-violet' },
  { title: 'Concluídos hoje', statuses: ['ENTREGUE', 'CANCELADO'], tone: 'bg-success' },
]

const HISTORY_PAGE_SIZE = 50
const STATUS_ORDER: OrderStatus[] = ['RECEBIDO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO']

/**
 * "Hoje" é o quadro operacional, ao vivo (inclui pedidos de dias anteriores ainda em andamento).
 * Qualquer outro período vira o histórico: todos os pedidos criados no intervalo, em qualquer status.
 */
export function SellerOrdersPage() {
  const [preset, setPreset] = useState<PeriodPreset>('today')
  const [custom, setCustom] = useState<DateRange>(() => ({ from: addDays(todayLocal(), -6), to: todayLocal() }))
  const range = useMemo(() => resolvePeriod(preset, custom), [preset, custom])
  const live = preset === 'today'

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Pedidos</h1>
          <p className="text-sm text-ink-muted">
            {live
              ? 'Em andamento e concluídos hoje · atualiza a cada 10 segundos'
              : 'Todos os pedidos criados no período, em qualquer status'}
          </p>
        </div>
        <PeriodFilter preset={preset} custom={custom} resolved={range} onPresetChange={setPreset} onCustomChange={setCustom} />
      </div>

      {live ? <OrderBoard /> : <OrderHistory key={`${range.from}|${range.to}`} range={range} />}
    </>
  )
}

function OrderBoard() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fresh, setFresh] = useState<Set<number>>(new Set())
  const [refreshKey, setRefreshKey] = useState(0)
  const [, setTick] = useState(0)
  const known = useRef<Set<number> | null>(null)

  // Atualiza o quadro periodicamente e destaca os pedidos que chegaram desde a última leitura.
  useEffect(() => {
    let active = true
    const load = () =>
      sellerApi
        .orders()
        .then((data) => {
          if (!active) return
          const ids = new Set(data.map((o) => o.id))
          if (known.current) {
            const arrived = data.filter((o) => !known.current!.has(o.id)).map((o) => o.id)
            if (arrived.length > 0) setFresh((f) => new Set([...f, ...arrived]))
          }
          known.current = ids
          setOrders(data)
          setError(null)
        })
        .catch((err) => active && setError(err instanceof ApiError ? err.message : 'Erro ao carregar pedidos.'))
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [refreshKey])

  // Reavalia o "há X min" a cada 30s.
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(timer)
  }, [])

  const newCount = orders?.filter((o) => o.status === 'RECEBIDO').length ?? 0
  useEffect(() => {
    const base = 'Foody Parceiros'
    document.title = newCount > 0 ? `(${newCount}) ${base}` : base
    return () => {
      document.title = 'Foody Delivery'
    }
  }, [newCount])

  function replace(updated: Order) {
    setOrders((current) => current?.map((o) => (o.id === updated.id ? updated : o)) ?? null)
    setFresh((f) => {
      const next = new Set(f)
      next.delete(updated.id)
      return next
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-end gap-2">
        {newCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-info-soft px-3 py-1 text-sm font-semibold text-info">
            <Bell size={14} /> {newCount} {newCount === 1 ? 'novo pedido' : 'novos pedidos'}
          </span>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRefreshKey((k) => k + 1)}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      {orders === null ? (
        <p className="py-12 text-center text-sm text-ink-muted">Carregando pedidos…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => {
            const items = orders.filter((o) => column.statuses.includes(o.status))
            return (
              <section key={column.title} className="flex min-w-0 flex-col rounded-xl bg-surface-alt p-3">
                <h2 className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-ink">
                  <span className={`size-2 rounded-full ${column.tone}`} />
                  {column.title}
                  <span className="ml-auto rounded-full bg-surface px-2 text-xs text-ink-muted">{items.length}</span>
                </h2>
                <div className="flex flex-col gap-3">
                  {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-ink-muted">Nenhum pedido</p>}
                  {items.map((order) => (
                    <OrderCard key={order.id} order={order} isNew={fresh.has(order.id)} onUpdated={replace} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}

function OrderHistory({ range }: { range: DateRange }) {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const { from, to } = range
  const complete = Boolean(from && to)

  // A página remonta este componente a cada período (key), então o estado já começa limpo aqui.
  useEffect(() => {
    if (!complete) return
    let active = true
    sellerApi
      .orders({ from, to })
      .then((data) => {
        if (!active) return
        setOrders(data)
        setError(null)
      })
      .catch((err) => active && setError(err instanceof ApiError ? err.message : 'Erro ao carregar pedidos.'))
    return () => {
      active = false
    }
  }, [from, to, complete, reloadKey])

  const counts = useMemo(() => {
    const byStatus = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<OrderStatus, number>
    orders?.forEach((o) => byStatus[o.status]++)
    return byStatus
  }, [orders])

  const filtered = useMemo(
    () => (orders ?? []).filter((o) => status === 'ALL' || o.status === status),
    [orders, status],
  )
  const pages = Math.max(1, Math.ceil(filtered.length / HISTORY_PAGE_SIZE))
  const visible = filtered.slice(page * HISTORY_PAGE_SIZE, (page + 1) * HISTORY_PAGE_SIZE)

  function selectStatus(next: OrderStatus | 'ALL') {
    setStatus(next)
    setPage(0)
  }

  if (!complete) return <p className="py-12 text-center text-sm text-ink-muted">Escolha as duas datas do período.</p>
  if (error) return <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
  if (orders === null) return <p className="py-12 text-center text-sm text-ink-muted">Carregando pedidos…</p>

  const chip = (value: OrderStatus | 'ALL', label: string, count: number) => (
    <button
      key={value}
      type="button"
      onClick={() => selectStatus(value)}
      className={`rounded-full border px-3 py-1 text-sm font-medium ${
        status === value ? 'border-accent bg-accent text-white' : 'border-border bg-surface text-ink hover:border-accent'
      }`}
    >
      {label} <span className={status === value ? 'text-white/80' : 'text-ink-muted'}>{formatNumber(count)}</span>
    </button>
  )

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {chip('ALL', 'Todos', orders.length)}
        {STATUS_ORDER.map((s) => chip(s, STATUS_LABELS[s], counts[s]))}
        <button
          type="button"
          className="btn btn-ghost btn-sm ml-auto"
          onClick={() => {
            setOrders(null)
            setReloadKey((k) => k + 1)
          }}
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="card py-12 text-center text-sm text-ink-muted">Nenhum pedido no período.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-ink-muted">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-medium">Pedido</th>
                <th className="px-3 py-2 text-left font-medium">Data</th>
                <th className="px-3 py-2 text-left font-medium">Cliente</th>
                <th className="px-3 py-2 text-left font-medium">Itens</th>
                <th className="px-3 py-2 text-left font-medium">Pagamento</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Valor</th>
                <th className="px-3 py-2 text-right font-medium">Lucro</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-semibold whitespace-nowrap text-ink">#{order.id}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-ink-muted">{formatDateTime(order.createdAt)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-ink">{order.customerName}</td>
                  <td className="max-w-64 truncate px-3 py-2 text-ink" title={itemsSummary(order)}>
                    {itemsSummary(order)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-ink-muted">{PAYMENT_LABELS[order.paymentMethod]}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap text-ink">{formatMoney(order.subtotal)}</td>
                  <td className="px-3 py-2 text-right font-semibold whitespace-nowrap text-success">
                    {order.financials ? formatMoney(order.financials.profit) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > HISTORY_PAGE_SIZE && (
        <div className="mt-3 flex items-center justify-between gap-2 text-sm text-ink-muted">
          <span>
            {formatNumber(page * HISTORY_PAGE_SIZE + 1)}–{formatNumber(page * HISTORY_PAGE_SIZE + visible.length)} de{' '}
            {formatNumber(filtered.length)}
          </span>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={14} /> Anterior
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={page >= pages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

const itemsSummary = (order: Order) => order.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')

function OrderCard({ order, isNew, onUpdated }: { order: Order; isNew: boolean; onUpdated: (o: Order) => void }) {
  const [pending, setPending] = useState<OrderStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const waiting = minutesSince(order.createdAt)
  const late = order.status === 'RECEBIDO' && waiting >= 5

  async function change(status: OrderStatus) {
    if (status === 'CANCELADO' && !window.confirm(`Cancelar o pedido #${order.id} de ${order.customerName}?`)) return
    setPending(status)
    setError(null)
    try {
      onUpdated(await sellerApi.updateStatus(order.id, status))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao atualizar.')
    } finally {
      setPending(null)
    }
  }

  return (
    <article
      className={`card flex flex-col gap-3 p-3.5 text-sm ${isNew ? 'ring-2 ring-info' : ''} ${late ? 'border-danger/50' : ''}`}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink">
            #{order.id} · {order.customerName}
          </p>
          <p className={`flex items-center gap-1 text-xs ${late ? 'font-semibold text-danger' : 'text-ink-muted'}`}>
            <Clock size={12} /> {formatTime(order.createdAt)} · há {waiting} min
          </p>
        </div>
        {isNew ? (
          <span className="rounded-full bg-info px-2 py-0.5 text-[10px] font-bold text-white uppercase">Novo</span>
        ) : (
          order.status === 'ENTREGUE' || order.status === 'CANCELADO' ? <StatusBadge status={order.status} /> : null
        )}
      </header>

      <ul className="space-y-1">
        {order.items.map((item) => (
          <li key={item.id} className="text-ink">
            <span className="font-semibold">{item.quantity}×</span> {item.productName}
            {item.notes && <span className="block pl-5 text-xs text-warning italic">↳ {item.notes}</span>}
          </li>
        ))}
      </ul>
      {order.notes && <p className="rounded-md bg-warning-soft px-2 py-1 text-xs text-warning">“{order.notes}”</p>}

      <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-ink-muted">
        <span className="flex min-w-0 items-center gap-1 truncate">
          <MapPin size={12} className="shrink-0" /> {order.deliveryAddress.neighborhood}
        </span>
        <span className="shrink-0">{PAYMENT_LABELS[order.paymentMethod]}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="font-semibold text-ink">{formatMoney(order.subtotal)}</span>
        {order.financials && (
          <span className="text-xs text-ink-muted" title="Lucro bruto estimado do pedido">
            lucro <span className="font-semibold text-success">{formatMoney(order.financials.profit)}</span>
          </span>
        )}
      </div>

      {order.nextStatuses.length > 0 && (
        <div className="flex gap-2">
          {order.nextStatuses.map((status) => (
            <button
              key={status}
              type="button"
              disabled={pending !== null}
              onClick={() => change(status)}
              className={`btn btn-sm ${status === 'CANCELADO' ? 'btn-danger' : 'btn-primary flex-1'}`}
            >
              {pending === status ? '…' : STATUS_ACTIONS[status]}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </article>
  )
}
