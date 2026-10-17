import { AlertTriangle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { sellerApi } from '../../api/seller'
import type { Fees, SellerCategory, SellerProduct } from '../../api/types'
import { Modal } from '../../components/Modal'
import { formatMoney, formatPercent } from '../../format'
import { estimateMargin, marginTone } from '../../utils/margin'

const EMOJIS = ['🍕', '🍔', '🍟', '🌭', '🥪', '🌯', '🍣', '🍜', '🍝', '🍲', '🍛', '🥗', '🍗', '🥩', '🧀', '🍰', '🍫', '🍩', '🍦', '☕', '🥤', '🧃', '🍺', '💧']

interface Props {
  product: SellerProduct | null
  categories: SellerCategory[]
  defaultCategoryId: number
  fees: Fees
  onClose: () => void
  onSaved: (product: SellerProduct) => void
}

const toNumber = (v: string) => Number(v.replace(',', '.'))

export function ProductModal({ product, categories, defaultCategoryId, fees, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    categoryId: product?.categoryId ?? defaultCategoryId,
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product ? String(product.price) : '',
    costPrice: product ? String(product.costPrice) : '',
    emoji: product?.emoji ?? '🍽️',
    imageUrl: product?.imageUrl ?? '',
    available: product?.available ?? true,
  })
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const price = toNumber(form.price) || 0
  const cost = toNumber(form.costPrice) || 0
  const m = estimateMargin(price, cost, fees)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setFieldErrors({})
    const body = {
      categoryId: Number(form.categoryId),
      name: form.name,
      description: form.description || undefined,
      price,
      costPrice: cost,
      emoji: form.emoji || undefined,
      imageUrl: form.imageUrl || undefined,
      available: form.available,
    }
    try {
      onSaved(product ? await sellerApi.updateProduct(product.id, body) : await sellerApi.createProduct(body))
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setFieldErrors(err.fieldErrors)
      } else {
        setError('Erro ao salvar o produto.')
      }
    } finally {
      setSaving(false)
    }
  }

  const fieldError = (name: string) =>
    fieldErrors[name] && <span className="text-xs font-normal text-danger">{fieldErrors[name]}</span>

  return (
    <Modal
      title={product ? 'Editar produto' : 'Novo produto'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="product-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar produto'}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-[1fr_240px]">
        <div className="flex flex-col gap-4">
          <label className="label">
            Nome
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={120} autoFocus />
            {fieldError('name')}
          </label>
          <label className="label">
            Descrição
            <textarea
              className="input min-h-16 resize-y"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={500}
              placeholder="Ingredientes, tamanho, o que acompanha…"
            />
          </label>
          <label className="label">
            Categoria
            <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="label">
              Preço de venda (R$)
              <input
                className="input"
                type="number"
                min={0.01}
                step={0.01}
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
              {fieldError('price')}
            </label>
            <label className="label">
              Custo (R$)
              <input
                className="input"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                required
              />
              <span className="text-xs font-normal text-ink-muted">Ingredientes + embalagem</span>
              {fieldError('costPrice')}
            </label>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-ink">Ícone</p>
            <div className="flex flex-wrap gap-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, emoji })}
                  className={`flex size-9 items-center justify-center rounded-lg text-xl ${
                    form.emoji === emoji ? 'bg-accent-soft ring-2 ring-accent' : 'hover:bg-surface-alt'
                  }`}
                  aria-label={`Ícone ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <label className="label">
            URL da foto (opcional)
            <input
              className="input"
              type="url"
              placeholder="https://…"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="size-4 accent-[var(--color-accent)]"
              checked={form.available}
              onChange={(e) => setForm({ ...form, available: e.target.checked })}
            />
            Disponível para pedidos
          </label>
          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        </div>

        {/* Simulação de margem ao vivo */}
        <aside className="h-fit rounded-xl border border-border bg-surface-alt p-4 text-sm">
          <p className="mb-3 text-[10px] font-bold tracking-wider text-accent uppercase">Quanto sobra por unidade</p>
          <dl className="space-y-1.5">
            <Row label="Preço de venda" value={formatMoney(m.price)} strong />
            <Row label={`Comissão (${formatPercent(fees.commissionPercent)})`} value={`− ${formatMoney(m.commission)}`} />
            <Row label={`Taxa pagto. (${formatPercent(fees.paymentFeePercent)})`} value={`− ${formatMoney(m.paymentFee)}`} />
            <Row label={`Imposto (${formatPercent(fees.taxPercent)})`} value={`− ${formatMoney(m.tax)}`} />
            <Row label="Custo do produto" value={`− ${formatMoney(m.cost)}`} />
          </dl>
          <div className="mt-3 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">Lucro</span>
              <span className={`font-bold ${m.profit >= 0 ? 'text-success' : 'text-danger'}`}>{formatMoney(m.profit)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-ink-muted">Margem</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${marginTone(m.margin)}`}>
                {formatPercent(Math.round(m.margin * 10) / 10)}
              </span>
            </div>
          </div>
          {price > 0 && m.margin < 15 && (
            <p className="mt-3 flex gap-2 rounded-lg bg-danger-soft p-2 text-xs text-danger">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              Margem baixa: depois das taxas, sobra pouco. Revise o preço ou o custo.
            </p>
          )}
          <p className="mt-3 text-xs text-ink-muted">Considera pagamento online. Percentuais em Configurações.</p>
        </aside>
      </form>
    </Modal>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className={strong ? 'font-medium text-ink' : 'text-ink-muted'}>{label}</dt>
      <dd className={strong ? 'font-semibold text-ink' : 'text-ink'}>{value}</dd>
    </div>
  )
}
