import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { ordersApi } from '../api/orders'
import { formatMoney } from '../format'

interface ItemRow {
  key: number
  productName: string
  quantity: string
  unitPrice: string
}

const EMPTY_ADDRESS = { street: '', number: '', complement: '', neighborhood: '', city: '', zipCode: '' }

let nextKey = 1
const newItem = (): ItemRow => ({ key: nextKey++, productName: '', quantity: '1', unitPrice: '' })

const toNumber = (value: string) => Number(value.replace(',', '.'))

export function NewOrderPage() {
  const navigate = useNavigate()
  const [customerName, setCustomerName] = useState('')
  const [address, setAddress] = useState(EMPTY_ADDRESS)
  const [items, setItems] = useState<ItemRow[]>(() => [newItem()])
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const total = items.reduce((sum, i) => sum + (toNumber(i.quantity) || 0) * (toNumber(i.unitPrice) || 0), 0)

  const updateItem = (key: number, patch: Partial<ItemRow>) =>
    setItems((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))

  const removeItem = (key: number) => setItems((rows) => rows.filter((row) => row.key !== key))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      const order = await ordersApi.create({
        customerName,
        deliveryAddress: address,
        items: items.map((i) => ({
          productName: i.productName,
          quantity: toNumber(i.quantity),
          unitPrice: toNumber(i.unitPrice),
        })),
      })
      navigate(`/pedidos/${order.id}`, { state: { created: true } })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setFieldErrors(err.fieldErrors)
      } else {
        setError('Erro inesperado ao criar o pedido.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const fieldError = (name: string) =>
    fieldErrors[name] ? <span className="field-error">{fieldErrors[name]}</span> : null

  const addressField = (name: keyof typeof EMPTY_ADDRESS, label: string, required = true) => (
    <label className={`field-${name}`}>
      {label}
      <input
        value={address[name]}
        onChange={(e) => setAddress({ ...address, [name]: e.target.value })}
        required={required}
      />
      {fieldError(`deliveryAddress.${name}`)}
    </label>
  )

  return (
    <>
      <div className="page-header">
        <h1>Novo pedido</h1>
        <Link to="/" className="btn btn-ghost">
          Voltar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="new-order">
        <section className="card form">
          <h2>Cliente</h2>
          <label>
            Nome do cliente
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required autoFocus />
            {fieldError('customerName')}
          </label>
        </section>

        <section className="card">
          <h2>Endereço de entrega</h2>
          <div className="address-grid">
            {addressField('street', 'Rua')}
            {addressField('number', 'Número')}
            {addressField('complement', 'Complemento', false)}
            {addressField('neighborhood', 'Bairro')}
            {addressField('city', 'Cidade')}
            {addressField('zipCode', 'CEP')}
          </div>
        </section>

        <section className="card">
          <h2>Itens</h2>
          {fieldError('items')}
          <div className="items">
            {items.map((item, index) => (
              <div key={item.key} className="item-row">
                <label className="item-product">
                  Produto
                  <input
                    value={item.productName}
                    onChange={(e) => updateItem(item.key, { productName: e.target.value })}
                    required
                  />
                  {fieldError(`items[${index}].productName`)}
                </label>
                <label className="item-qty">
                  Qtd.
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.key, { quantity: e.target.value })}
                    required
                  />
                  {fieldError(`items[${index}].quantity`)}
                </label>
                <label className="item-price">
                  Preço unit. (R$)
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.key, { unitPrice: e.target.value })}
                    required
                  />
                  {fieldError(`items[${index}].unitPrice`)}
                </label>
                <div className="item-subtotal">
                  <span className="hint">Subtotal</span>
                  <span>{formatMoney((toNumber(item.quantity) || 0) * (toNumber(item.unitPrice) || 0))}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm item-remove"
                  onClick={() => removeItem(item.key)}
                  disabled={items.length === 1}
                  aria-label={`Remover item ${index + 1}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setItems([...items, newItem()])}>
            + Adicionar item
          </button>
        </section>

        <div className="card submit-bar">
          <div>
            <span className="muted">Total</span>
            <div className="total">{formatMoney(total)}</div>
          </div>
          {error && <p className="alert">{error}</p>}
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Criando…' : 'Criar pedido'}
          </button>
        </div>
      </form>
    </>
  )
}
