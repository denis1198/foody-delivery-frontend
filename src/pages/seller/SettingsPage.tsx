import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { sellerApi } from '../../api/seller'
import { formatMoney, RESTAURANT_CATEGORIES } from '../../format'
import { useSellerRestaurant } from '../../layouts/sellerContext'

const LOGOS = ['🍕', '🍔', '🍣', '🍲', '🍰', '🥗', '🌮', '🥙', '🍜', '🍗', '🥩', '🍇', '☕', '🍩', '🍽️']

export function SettingsPage() {
  const { restaurant, setRestaurant } = useSellerRestaurant()
  const [form, setForm] = useState({
    name: restaurant.name,
    category: restaurant.category,
    description: restaurant.description ?? '',
    logoEmoji: restaurant.logoEmoji,
    deliveryFee: String(restaurant.deliveryFee),
    prepTimeMin: String(restaurant.prepTimeMin),
    prepTimeMax: String(restaurant.prepTimeMax),
    commissionPercent: String(restaurant.commissionPercent),
    paymentFeePercent: String(restaurant.paymentFeePercent),
    taxPercent: String(restaurant.taxPercent),
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const num = (v: string) => Number(v.replace(',', '.')) || 0
  const set = (field: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [field]: e.target.value })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setFieldErrors({})
    try {
      const saved = await sellerApi.updateRestaurant({
        name: form.name,
        category: form.category,
        description: form.description || null,
        logoEmoji: form.logoEmoji,
        deliveryFee: num(form.deliveryFee),
        prepTimeMin: num(form.prepTimeMin),
        prepTimeMax: num(form.prepTimeMax),
        commissionPercent: num(form.commissionPercent),
        paymentFeePercent: num(form.paymentFeePercent),
        taxPercent: num(form.taxPercent),
      })
      setRestaurant(saved)
      setMessage({ ok: true, text: 'Configurações salvas. Os novos percentuais valem para os próximos pedidos.' })
    } catch (err) {
      if (err instanceof ApiError) {
        setMessage({ ok: false, text: err.message })
        setFieldErrors(err.fieldErrors)
      } else {
        setMessage({ ok: false, text: 'Erro ao salvar.' })
      }
    } finally {
      setSaving(false)
    }
  }

  const fieldError = (name: string) => fieldErrors[name] && <span className="text-xs font-normal text-danger">{fieldErrors[name]}</span>
  const deductions = num(form.commissionPercent) + num(form.paymentFeePercent) + num(form.taxPercent)

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Configurações</h1>
        <p className="text-sm text-ink-muted">Como seu restaurante aparece para os clientes e as taxas usadas nas métricas.</p>
      </div>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-ink">Perfil da loja</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label sm:col-span-2">
            Nome
            <input className="input" value={form.name} onChange={set('name')} required maxLength={120} />
            {fieldError('name')}
          </label>
          <label className="label">
            Categoria
            <select className="input" value={form.category} onChange={set('category')}>
              {RESTAURANT_CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="label">
            Logo
            <div className="flex flex-wrap gap-1">
              {LOGOS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, logoEmoji: emoji })}
                  className={`flex size-9 items-center justify-center rounded-lg text-xl ${form.logoEmoji === emoji ? 'bg-accent-soft ring-2 ring-accent' : 'hover:bg-surface-alt'}`}
                  aria-label={`Logo ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <label className="label sm:col-span-2">
            Descrição
            <textarea className="input min-h-16 resize-y" value={form.description} onChange={set('description')} maxLength={500} />
          </label>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-ink">Entrega</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="label">
            Taxa de entrega (R$)
            <input className="input" type="number" min={0} step={0.01} value={form.deliveryFee} onChange={set('deliveryFee')} required />
            {fieldError('deliveryFee')}
          </label>
          <label className="label">
            Preparo mínimo (min)
            <input className="input" type="number" min={1} max={240} value={form.prepTimeMin} onChange={set('prepTimeMin')} required />
          </label>
          <label className="label">
            Preparo máximo (min)
            <input className="input" type="number" min={1} max={240} value={form.prepTimeMax} onChange={set('prepTimeMax')} required />
          </label>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-ink">Taxas e impostos</h2>
        <p className="mb-4 text-sm text-ink-muted">Usados para calcular líquido, lucro e margem. Cada pedido guarda os percentuais vigentes quando foi feito.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="label">
            Comissão da plataforma (%)
            <input className="input" type="number" min={0} max={50} step={0.01} value={form.commissionPercent} onChange={set('commissionPercent')} required />
            {fieldError('commissionPercent')}
          </label>
          <label className="label">
            Taxa de pagamento online (%)
            <input className="input" type="number" min={0} max={20} step={0.01} value={form.paymentFeePercent} onChange={set('paymentFeePercent')} required />
            {fieldError('paymentFeePercent')}
          </label>
          <label className="label">
            Imposto sobre a venda (%)
            <input className="input" type="number" min={0} max={40} step={0.01} value={form.taxPercent} onChange={set('taxPercent')} required />
            {fieldError('taxPercent')}
          </label>
        </div>
        <p className="mt-4 rounded-lg bg-surface-alt px-3 py-2.5 text-sm text-ink">
          A cada <strong>{formatMoney(100)}</strong> vendidos online, {formatMoney(deductions)} vão para comissão, taxa e imposto.
          Sobram <strong>{formatMoney(100 - deductions)}</strong> para cobrir o custo dos produtos e gerar lucro.
        </p>
      </section>

      {message && (
        <p className={`rounded-lg px-3 py-2 text-sm ${message.ok ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>{message.text}</p>
      )}
      <div className="flex justify-end">
        <button className="btn btn-primary" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar configurações'}
        </button>
      </div>
    </form>
  )
}
