import { Banknote, CreditCard, QrCode, type LucideIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../../api/client'
import { customerApi } from '../../api/orders'
import type { PaymentMethod } from '../../api/types'
import { CartPanel } from '../../cart/CartPanel'
import { useCart } from '../../cart/useCart'
import { formatMoney } from '../../format'

const ADDRESS_KEY = 'foody.lastAddress'
const EMPTY_ADDRESS = { street: '', number: '', complement: '', neighborhood: '', city: '', zipCode: '' }
type AddressForm = typeof EMPTY_ADDRESS

const PAYMENTS: { value: PaymentMethod; label: string; hint: string; icon: LucideIcon }[] = [
  { value: 'PIX', label: 'Pix', hint: 'Aprovação na hora', icon: QrCode },
  { value: 'CARTAO', label: 'Cartão', hint: 'Crédito ou débito', icon: CreditCard },
  { value: 'DINHEIRO', label: 'Dinheiro', hint: 'Pague na entrega', icon: Banknote },
]

function lastAddress(): AddressForm {
  try {
    return { ...EMPTY_ADDRESS, ...JSON.parse(localStorage.getItem(ADDRESS_KEY) ?? '{}') }
  } catch {
    return EMPTY_ADDRESS
  }
}

export function CheckoutPage() {
  const cart = useCart()
  const navigate = useNavigate()
  const [address, setAddress] = useState<AddressForm>(lastAddress)
  const [payment, setPayment] = useState<PaymentMethod>('PIX')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  if (!cart.restaurant) {
    return (
      <div className="card mx-auto max-w-md px-6 py-12 text-center">
        <p className="text-ink-muted">Seu carrinho está vazio.</p>
        <Link to="/" className="btn btn-primary mt-4">
          Ver restaurantes
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!cart.restaurant) return
    setError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      const order = await customerApi.createOrder({
        restaurantId: cart.restaurant.id,
        items: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, notes: l.notes || undefined })),
        deliveryAddress: address,
        paymentMethod: payment,
        notes: notes || undefined,
      })
      try {
        localStorage.setItem(ADDRESS_KEY, JSON.stringify(address))
      } catch {
        // só não lembra o endereço
      }
      cart.clear()
      navigate(`/meus-pedidos/${order.id}`, { state: { created: true } })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setFieldErrors(err.fieldErrors)
      } else {
        setError('Erro inesperado ao enviar o pedido.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const field = (name: keyof AddressForm, label: string, className = '', required = true) => (
    <label className={`label ${className}`}>
      {label}
      <input
        className="input"
        value={address[name]}
        onChange={(e) => setAddress({ ...address, [name]: e.target.value })}
        required={required}
      />
      {fieldErrors[`deliveryAddress.${name}`] && (
        <span className="text-xs font-normal text-danger">{fieldErrors[`deliveryAddress.${name}`]}</span>
      )}
    </label>
  )

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex min-w-0 flex-col gap-6">
        <h1 className="text-2xl font-bold text-ink">Finalizar pedido</h1>

        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-ink">Endereço de entrega</h2>
          <div className="grid gap-4 sm:grid-cols-6">
            {field('street', 'Rua', 'sm:col-span-4')}
            {field('number', 'Número', 'sm:col-span-2')}
            {field('complement', 'Complemento', 'sm:col-span-3', false)}
            {field('neighborhood', 'Bairro', 'sm:col-span-3')}
            {field('city', 'Cidade', 'sm:col-span-4')}
            {field('zipCode', 'CEP', 'sm:col-span-2')}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-ink">Pagamento</h2>
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Forma de pagamento">
            {PAYMENTS.map(({ value, label, hint, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={payment === value}
                onClick={() => setPayment(value)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  payment === value ? 'border-accent bg-accent-soft' : 'border-border hover:bg-surface-alt'
                }`}
              >
                <Icon size={20} className={payment === value ? 'text-accent' : 'text-ink-muted'} />
                <span>
                  <span className="block text-sm font-semibold text-ink">{label}</span>
                  <span className="block text-xs text-ink-muted">{hint}</span>
                </span>
              </button>
            ))}
          </div>
          <label className="label mt-4">
            Observações para o restaurante
            <input
              className="input"
              placeholder="Ex.: interfone com defeito, me ligue ao chegar"
              maxLength={300}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </section>
      </div>

      <aside>
        <div className="card sticky top-20 flex flex-col gap-4 p-5">
          <CartPanel showCheckout={false} />
          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
          <button className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? 'Enviando pedido…' : `Fazer pedido • ${formatMoney(cart.subtotal + cart.restaurant.deliveryFee)}`}
          </button>
        </div>
      </aside>
    </form>
  )
}
