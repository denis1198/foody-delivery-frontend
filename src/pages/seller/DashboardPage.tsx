import {
  Ban,
  ChevronDown,
  Coins,
  DollarSign,
  Package,
  Percent,
  Receipt,
  ShoppingBag,
  Table2,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ApiError } from '../../api/client'
import { sellerApi } from '../../api/seller'
import type { Dashboard } from '../../api/types'
import { ChartCard } from '../../components/dashboard/ChartCard'
import { CHART_COLORS, tooltipStyle } from '../../components/dashboard/chartTheme'
import { PeriodFilter } from '../../components/dashboard/PeriodFilter'
import { percentDelta, pointsDelta } from '../../components/dashboard/delta'
import { StatCard } from '../../components/dashboard/StatCard'
import { InfoTooltip } from '../../components/InfoTooltip'
import { StatusBadge } from '../../components/StatusBadge'
import {
  formatDay,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
} from '../../format'
import { useSellerRestaurant } from '../../layouts/sellerContext'
import { useTheme } from '../../theme/useTheme'
import { addDays, resolvePeriod, todayLocal, type DateRange, type PeriodPreset } from '../../utils/period'

/** Ordem fixa das séries (e da legenda): faturamento → líquido → lucro. */
const SERIES_ORDER = ['revenue', 'net', 'profit']

export function DashboardPage() {
  const { restaurant } = useSellerRestaurant()
  const { theme } = useTheme()
  const colors = CHART_COLORS[theme]
  const tip = tooltipStyle(theme)

  const [preset, setPreset] = useState<PeriodPreset>('today')
  const [custom, setCustom] = useState<DateRange>(() => ({ from: addDays(todayLocal(), -14), to: todayLocal() }))
  const [result, setResult] = useState<{ key: string; data: Dashboard | null; error: string | null } | null>(null)
  const [showMore, setShowMore] = useState(false)
  const [showTable, setShowTable] = useState(false)

  const range = useMemo(() => resolvePeriod(preset, custom), [preset, custom])
  const rangeKey = `${range.from}|${range.to}`
  // Mantém os dados anteriores na tela enquanto o novo período carrega.
  const data = result?.data ?? null
  const error = result?.key === rangeKey ? result.error : null
  const loading = result?.key !== rangeKey

  // Com um dia só, o gráfico de receitas teria um ponto: mostra os 7 dias até a data, como no Manager.
  const singleDay = range.from === range.to
  const trendKey = singleDay ? `${addDays(range.to, -6)}|${range.to}` : null
  const [trend, setTrend] = useState<{ key: string; days: Dashboard['revenueByDay'] } | null>(null)
  useEffect(() => {
    if (!trendKey) return
    let active = true
    const [from, to] = trendKey.split('|')
    sellerApi
      .dashboard(from, to)
      .then((d) => active && setTrend({ key: trendKey, days: d.revenueByDay }))
      .catch(() => active && setTrend({ key: trendKey, days: [] }))
    return () => {
      active = false
    }
  }, [trendKey])
  const revenueDays = singleDay ? (trend?.key === trendKey ? trend.days : []) : (data?.revenueByDay ?? [])

  useEffect(() => {
    if (!range.from || !range.to || range.from > range.to) return
    let active = true
    const key = `${range.from}|${range.to}`
    sellerApi
      .dashboard(range.from, range.to)
      .then((d) => active && setResult({ key, data: d, error: null }))
      .catch((err) =>
        active &&
        setResult((prev) => ({
          key,
          data: prev?.data ?? null,
          error: err instanceof ApiError ? err.message : 'Erro ao carregar a dashboard.',
        })),
      )
    return () => {
      active = false
    }
  }, [range.from, range.to])

  const s = data?.summary
  const compareLabel = data?.period.days === 1 ? 'vs. ontem' : 'vs. anterior'
  const p = data?.previous
  const fees = `comissão ${formatPercent(restaurant.commissionPercent)}, taxa de pagamento ${formatPercent(restaurant.paymentFeePercent)} (só online) e imposto ${formatPercent(restaurant.taxPercent)}`

  const insights = useMemo(() => (data ? buildInsights(data) : null), [data])
  const peakHours = useMemo(() => {
    if (!data) return new Set<number>()
    const top = [...data.ordersByHour].filter((h) => h.orders > 0).sort((a, b) => b.orders - a.orders).slice(0, 3)
    return new Set(top.map((h) => h.hour))
  }, [data])
  const visibleHours = useMemo(
    () => trimHours(data?.ordersByHour ?? []).map((h) => ({ ...h, peakLabel: peakHours.has(h.hour) ? h.orders : null })),
    [data, peakHours],
  )

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
          <p className="text-sm text-ink-muted">Desempenho financeiro e operacional do {restaurant.name}</p>
          {data?.period.comparedUntilNow && (
            <p className="mt-0.5 text-xs text-ink-muted">
              Período em andamento: as variações comparam com {data.period.days === 1 ? 'ontem' : 'o período anterior'} até este mesmo horário.
            </p>
          )}
        </div>
        <PeriodFilter preset={preset} custom={custom} resolved={range} onPresetChange={setPreset} onCustomChange={setCustom} />
      </div>

      {error && <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      {/* KPIs principais */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Faturamento"
          value={s ? formatMoney(s.revenue) : '—'}
          loading={loading}
          compareLabel={compareLabel}
          delta={s && p ? percentDelta(s.revenue, p.revenue) : null}
          tooltip={
            <InfoTooltip
              align="left"
              description="Soma do valor dos itens vendidos no período, sem a taxa de entrega. Pedidos cancelados não entram."
              rows={s ? [
                { label: 'Taxas de entrega (repassadas)', value: formatMoney(s.deliveryFees) },
                { label: 'Total pago pelos clientes', value: formatMoney(s.revenue + s.deliveryFees) },
                { label: 'Perdido em cancelamentos', value: formatMoney(s.cancelledRevenue) },
              ] : undefined}
            />
          }
        />
        <StatCard
          icon={Wallet}
          label="Líquido"
          value={s ? formatMoney(s.net) : '—'}
          loading={loading}
          compareLabel={compareLabel}
          delta={s && p ? percentDelta(s.net, p.net) : null}
          tooltip={
            <InfoTooltip
              description="O que a plataforma repassa ao restaurante: faturamento menos a comissão e a taxa de pagamento online."
              rows={s ? [
                { label: 'Comissão da plataforma', value: `− ${formatMoney(s.commission)}` },
                { label: 'Taxa de pagamento', value: `− ${formatMoney(s.paymentFees)}` },
              ] : undefined}
            />
          }
        />
        <StatCard
          icon={Coins}
          label="Lucro Bruto"
          value={s ? formatMoney(s.profit) : '—'}
          loading={loading}
          compareLabel={compareLabel}
          delta={s && p ? percentDelta(s.profit, p.profit) : null}
          tooltip={
            <InfoTooltip
              description="Líquido menos o custo dos produtos vendidos (CMV, cadastrado no cardápio) e o imposto sobre a venda."
              rows={s ? [
                { label: 'CMV', value: `− ${formatMoney(s.cost)}` },
                { label: 'Impostos', value: `− ${formatMoney(s.taxes)}` },
              ] : undefined}
            />
          }
        />
        <StatCard
          icon={Percent}
          label="Margem"
          value={s ? formatPercent(s.margin) : '—'}
          loading={loading}
          compareLabel={compareLabel}
          delta={s && p && p.salesCount > 0 ? pointsDelta(s.margin, p.margin) : null}
          tooltip={<InfoTooltip align="right" description={`Lucro bruto dividido pelo faturamento. Usa ${fees}.`} />}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ShoppingBag}
          label="Número de vendas"
          value={s ? formatNumber(s.salesCount) : '—'}
          loading={loading}
          compareLabel={compareLabel}
          delta={s && p ? percentDelta(s.salesCount, p.salesCount) : null}
          tooltip={<InfoTooltip align="left" description="Pedidos não cancelados no período, incluindo os que ainda estão em andamento." />}
        />
        <StatCard
          icon={Package}
          label="Itens vendidos"
          value={s ? formatNumber(s.itemsSold) : '—'}
          loading={loading}
          compareLabel={compareLabel}
          delta={s && p ? percentDelta(s.itemsSold, p.itemsSold) : null}
          tooltip={<InfoTooltip description="Soma das quantidades de todos os itens dos pedidos válidos." />}
        />
        <StatCard
          icon={TrendingUp}
          label="Ticket médio"
          value={s ? formatMoney(s.averageTicket) : '—'}
          loading={loading}
          compareLabel={compareLabel}
          delta={s && p ? percentDelta(s.averageTicket, p.averageTicket) : null}
          tooltip={<InfoTooltip description="Faturamento dividido pelo número de vendas (por pedido, sem a taxa de entrega)." />}
        />
        <StatCard
          icon={Ban}
          label="Cancelamentos"
          value={s ? `${formatNumber(s.cancelledCount)} · ${formatMoney(s.cancelledRevenue)}` : '—'}
          loading={loading}
          compareLabel={compareLabel}
          delta={s && p ? percentDelta(s.cancelledCount, p.cancelledCount, false) : null}
          tooltip={
            <InfoTooltip
              align="right"
              description="Pedidos cancelados no período e o valor em itens que deixou de ser vendido."
              rows={s ? [{ label: 'Taxa de cancelamento', value: formatPercent(rate(s.cancelledCount, s.cancelledCount + s.salesCount)) }] : undefined}
            />
          }
        />
      </div>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-accent"
        aria-expanded={showMore}
      >
        <ChevronDown size={16} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
        {showMore ? 'Menos métricas' : 'Mais métricas'}
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ${showMore ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Receipt} label="Comissão paga à plataforma" value={s ? formatMoney(s.commission) : '—'} loading={loading}
          compareLabel={compareLabel}
              tooltip={<InfoTooltip align="left" description={`${formatPercent(restaurant.commissionPercent)} sobre o faturamento de cada pedido.`} />} />
            <StatCard icon={Receipt} label="Taxas de pagamento" value={s ? formatMoney(s.paymentFees) : '—'} loading={loading}
          compareLabel={compareLabel}
              tooltip={<InfoTooltip description={`${formatPercent(restaurant.paymentFeePercent)} sobre pedidos pagos online (Pix e cartão). Dinheiro não paga taxa.`} />} />
            <StatCard icon={Receipt} label="Impostos" value={s ? formatMoney(s.taxes) : '—'} loading={loading}
          compareLabel={compareLabel}
              tooltip={<InfoTooltip align="right" description={`${formatPercent(restaurant.taxPercent)} sobre o faturamento.`} />} />
            <StatCard icon={Package} label="CMV (custo dos produtos)" value={s ? formatMoney(s.cost) : '—'} loading={loading}
          compareLabel={compareLabel}
              tooltip={<InfoTooltip align="left" description="Soma do custo cadastrado de cada item vendido, no valor da época da venda." />} />
            <StatCard icon={Wallet} label="Taxas de entrega (repassadas)" value={s ? formatMoney(s.deliveryFees) : '—'} loading={loading}
          compareLabel={compareLabel}
              tooltip={<InfoTooltip description="Cobradas do cliente e repassadas ao entregador; ficam fora do faturamento e do lucro." />} />
            <StatCard icon={TrendingUp} label="Retorno sobre o custo (ROI)" value={s ? formatPercent(s.roi) : '—'} loading={loading}
          compareLabel={compareLabel}
              tooltip={<InfoTooltip align="right" description="Lucro bruto dividido pelo CMV: quanto cada real gasto em insumos devolveu de lucro." />} />
          </div>
        </div>
      </div>

      {/* Receita + dias fracos */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Resumo de receitas"
            subtitle={singleDay ? `Últimos 7 dias até ${formatDay(range.to)}` : 'Faturamento, líquido e lucro bruto por dia'}
            height={showTable ? 'max-h-72 overflow-auto' : 'h-72'}
            action={
              <button
                type="button"
                onClick={() => setShowTable((v) => !v)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-muted hover:bg-surface-alt hover:text-ink"
                aria-pressed={showTable}
              >
                <Table2 size={13} /> {showTable ? 'Ver gráfico' : 'Ver tabela'}
              </button>
            }
          >
            {showTable ? (
              <RevenueTable days={revenueDays} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueDays} margin={{ left: -8, right: 8, top: 4 }}>
                  <defs>
                    {colors.series.map((c, i) => (
                      <linearGradient key={c} id={`area-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={0.22} />
                        <stop offset="100%" stopColor={c} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                  <XAxis dataKey="day" tickFormatter={(d: string) => formatDay(d, false)} tick={{ fontSize: 11, fill: colors.axis }} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis tickFormatter={(v: number) => formatMoneyCompact(v)} tick={{ fontSize: 11, fill: colors.axis }} axisLine={false} tickLine={false} width={64} />
                  <Tooltip
                    {...tip}
                    labelFormatter={(d) => formatDay(String(d))}
                    formatter={(v) => formatMoney(Number(v))}
                    cursor={{ stroke: colors.axis, strokeDasharray: '3 3' }}
                  />
                  <Legend
                    iconType="plainline"
                    wrapperStyle={{ fontSize: 12, color: colors.ink }}
                    itemSorter={(item) => SERIES_ORDER.indexOf(String(item.dataKey))}
                  />
                  <Area type="monotone" dataKey="revenue" name="Faturamento" stroke={colors.series[0]} strokeWidth={2} fill="url(#area-0)" activeDot={{ r: 4, strokeWidth: 2, stroke: colors.surface }} />
                  <Area type="monotone" dataKey="net" name="Líquido" stroke={colors.series[1]} strokeWidth={2} fill="url(#area-1)" activeDot={{ r: 4, strokeWidth: 2, stroke: colors.surface }} />
                  <Area type="monotone" dataKey="profit" name="Lucro bruto" stroke={colors.series[2]} strokeWidth={2} fill="url(#area-2)" activeDot={{ r: 4, strokeWidth: 2, stroke: colors.surface }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Dias mais fracos</h2>
          <p className="mb-3 text-xs text-ink-muted">Datas com menos vendas no período (dias completos)</p>
          {!data || data.weakestDays.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">Escolha um período com mais de um dia.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {data.weakestDays.map((d, i) => (
                <li key={d.day} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-danger-soft text-xs font-bold text-danger">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink capitalize">{formatDay(d.day)}</p>
                    <p className="text-xs text-ink-muted">{formatMoney(d.revenue)} em vendas</p>
                  </div>
                  <span className="text-sm font-semibold text-ink">{d.orders} {d.orders === 1 ? 'venda' : 'vendas'}</span>
                </li>
              ))}
            </ol>
          )}
          {insights?.weekday && (
            <p className="mt-4 rounded-lg bg-surface-alt px-3 py-2.5 text-xs leading-relaxed text-ink">{insights.weekday}</p>
          )}
        </div>
      </div>

      {/* Picos + dias da semana */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Picos de movimentação" subtitle={insights?.peak ?? 'Pedidos por hora do dia'}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visibleHours} margin={{ left: -20, right: 4, top: 18 }} barCategoryGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
              <XAxis dataKey="hour" tickFormatter={(h: number) => `${h}h`} tick={{ fontSize: 11, fill: colors.axis }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: colors.axis }} axisLine={false} tickLine={false} />
              <Tooltip
                {...tip}
                cursor={{ fill: colors.grid, opacity: 0.6 }}
                labelFormatter={(h) => `${h}h – ${Number(h) + 1}h`}
                formatter={(v, name) => (name === 'orders' ? [`${v} pedidos`, 'Pedidos'] : [formatMoney(Number(v)), 'Faturamento'])}
              />
              <Bar dataKey="orders" name="orders" radius={[4, 4, 0, 0]} fill={colors.series[0]} isAnimationActive={false}>
                <LabelList dataKey="peakLabel" position="top" style={{ fontSize: 11, fontWeight: 600, fill: colors.ink }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Desempenho por dia da semana" subtitle="Média de pedidos por dia (dias completos)">
          {data && data.period.days < 2 ? (
            <p className="flex h-full items-center justify-center px-6 text-center text-sm text-ink-muted">
              Escolha um período com mais de um dia para comparar os dias da semana.
            </p>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.weekdays ?? []} margin={{ left: -20, right: 4, top: 18 }} barCategoryGap="22%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.axis }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: colors.axis }} axisLine={false} tickLine={false} />
              <Tooltip
                {...tip}
                cursor={{ fill: colors.grid, opacity: 0.6 }}
                formatter={(v, name) =>
                  name === 'avgOrders' ? [`${formatNumber(Number(v))} pedidos/dia`, 'Média'] : [formatMoney(Number(v)), 'Faturamento médio']
                }
              />
              <Bar dataKey="avgOrders" name="avgOrders" radius={[4, 4, 0, 0]} fill={colors.series[0]} isAnimationActive={false}>
                <LabelList
                  dataKey="avgOrders"
                  position="top"
                  formatter={(v) => formatNumber(Number(v))}
                  style={{ fontSize: 11, fill: colors.ink }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Top produtos + status */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4 shadow-card lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink">Top 15 produtos vendidos</h2>
          <p className="mb-3 text-xs text-ink-muted">Por faturamento · lucro já descontando comissão, taxas, imposto e custo</p>
          {!data || data.topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">Nenhuma venda no período.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.topProducts.map((product, i) => (
                <li key={product.productId ?? product.productName} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border px-4 py-3">
                  <span className="w-5 text-sm font-semibold text-ink-muted">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{product.productName}</p>
                    <p className="text-xs text-ink-muted">
                      Preço médio {formatMoney(product.avgPrice)} · custo unit. {formatMoney(product.avgCost)}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-surface-alt px-2.5 py-1 text-xs font-medium text-ink">
                    <Package size={12} /> {formatNumber(product.unitsSold)} un.
                  </span>
                  <div className="w-28 text-right">
                    <p className="text-sm font-semibold text-ink">{formatMoney(product.revenue)}</p>
                    <p className="text-xs text-ink-muted">{formatPercent(product.share)} do total</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.profit >= 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                    {formatMoney(product.profit)} · {formatPercent(product.margin)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="h-fit rounded-lg border border-border bg-surface p-4 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Pedidos por status</h2>
          <p className="mb-4 text-xs text-ink-muted">Todos os pedidos criados no período</p>
          {data && (
            <ul className="flex flex-col gap-3">
              {data.statusBreakdown.map(({ status, count }) => {
                const total = data.statusBreakdown.reduce((sum, x) => sum + x.count, 0)
                const share = rate(count, total)
                return (
                  <li key={status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <StatusBadge status={status} />
                      <span className="font-medium text-ink">
                        {formatNumber(count)} <span className="text-xs font-normal text-ink-muted">({formatPercent(Math.round(share * 10) / 10)})</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-alt">
                      <div className="h-full rounded-full bg-ink-muted/60" style={{ width: `${share}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

function RevenueTable({ days }: { days: Dashboard['revenueByDay'] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-surface text-xs text-ink-muted">
        <tr>
          <th className="py-2 text-left font-medium">Dia</th>
          <th className="py-2 text-right font-medium">Pedidos</th>
          <th className="py-2 text-right font-medium">Faturamento</th>
          <th className="py-2 text-right font-medium">Líquido</th>
          <th className="py-2 text-right font-medium">Lucro bruto</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {[...days].reverse().map((d) => (
          <tr key={d.day} className="text-ink">
            <td className="py-1.5 capitalize">{formatDay(d.day)}</td>
            <td className="py-1.5 text-right">{d.orders}</td>
            <td className="py-1.5 text-right">{formatMoney(d.revenue)}</td>
            <td className="py-1.5 text-right">{formatMoney(d.net)}</td>
            <td className="py-1.5 text-right">{formatMoney(d.profit)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Remove as horas sem movimento nas pontas (madrugada), mantendo o intervalo contínuo. */
function trimHours(hours: Dashboard['ordersByHour']) {
  const first = hours.findIndex((h) => h.orders > 0)
  if (first === -1) return hours.filter((h) => h.hour >= 8)
  let last = hours.length - 1
  while (last > first && hours[last].orders === 0) last--
  return hours.slice(first, last + 1)
}

function rate(part: number, total: number) {
  return total === 0 ? 0 : (part / total) * 100
}

/** Frases de leitura rápida para os gráficos de pico e dias da semana. */
function buildInsights(d: Dashboard) {
  const hours = d.ordersByHour.filter((h) => h.orders > 0)
  const totalOrders = hours.reduce((sum, h) => sum + h.orders, 0)
  let peak: string | null = null
  if (totalOrders >= 10) {
    const top = [...hours].sort((a, b) => b.orders - a.orders)[0]
    const lunch = hours.filter((h) => h.hour >= 11 && h.hour <= 14).reduce((s, h) => s + h.orders, 0)
    const dinner = hours.filter((h) => h.hour >= 18 && h.hour <= 22).reduce((s, h) => s + h.orders, 0)
    peak = `Pico às ${top.hour}h · almoço (11h–15h) concentra ${formatPercent(Math.round(rate(lunch, totalOrders)))} e jantar (18h–23h) ${formatPercent(Math.round(rate(dinner, totalOrders)))} dos pedidos`
  }

  const days = d.weekdays.filter((w) => w.occurrences > 0)
  let weekday: string | null = null
  if (days.length >= 2) {
    const weakest = [...days].sort((a, b) => a.avgOrders - b.avgOrders)[0]
    const strongest = [...days].sort((a, b) => b.avgOrders - a.avgOrders)[0]
    if (strongest.avgOrders > 0) {
      const gap = Math.round((1 - weakest.avgOrders / strongest.avgOrders) * 100)
      weekday = `💡 ${weekdayName(weakest.weekday)} é o dia mais fraco da semana: ${formatNumber(weakest.avgOrders)} pedidos em média, ${gap}% abaixo de ${weekdayName(strongest.weekday).toLowerCase()} (${formatNumber(strongest.avgOrders)}). Promoções nesse dia podem equilibrar a operação.`
    }
  }
  return { peak, weekday }
}

function weekdayName(isoWeekday: number) {
  return ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'][isoWeekday - 1]
}
