import { ArrowLeft, Bike, Clock, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '../../api/client'
import { customerApi } from '../../api/orders'
import type { Menu, MenuItem } from '../../api/types'
import { CartPanel } from '../../cart/CartPanel'
import { useCart } from '../../cart/useCart'
import { Modal } from '../../components/Modal'
import { formatMoney } from '../../format'

export function RestaurantPage() {
  const id = Number(useParams().id)
  const cart = useCart()
  const [result, setResult] = useState<{ id: number; menu?: Menu; error?: string } | null>(null)
  const [selected, setSelected] = useState<MenuItem | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    let active = true
    customerApi
      .menu(id)
      .then((menu) => active && setResult({ id, menu }))
      .catch((err) => active && setResult({ id, error: err instanceof ApiError ? err.message : 'Erro ao carregar o cardápio.' }))
    return () => {
      active = false
    }
  }, [id])

  if (!result || result.id !== id) return <p className="py-20 text-center text-sm text-ink-muted">Carregando cardápio…</p>
  if (!result.menu) return <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result.error}</p>

  const { restaurant, categories } = result.menu
  const cartHere = cart.restaurant?.id === restaurant.id

  return (
    <>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-accent">
        <ArrowLeft size={16} /> Restaurantes
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <header className="card mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-5xl">
              {restaurant.logoEmoji}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-ink">{restaurant.name}</h1>
              <p className="text-sm text-ink-muted">{restaurant.category}</p>
              {restaurant.description && <p className="mt-1 text-sm text-ink">{restaurant.description}</p>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {restaurant.prepTimeMin}–{restaurant.prepTimeMax} min
                </span>
                <span className="flex items-center gap-1">
                  <Bike size={12} /> {restaurant.deliveryFee === 0 ? 'Entrega grátis' : `Entrega ${formatMoney(restaurant.deliveryFee)}`}
                </span>
              </div>
            </div>
          </header>

          {!restaurant.open && (
            <p className="mb-6 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
              Este restaurante está fechado no momento. Você pode ver o cardápio, mas não é possível fazer pedidos.
            </p>
          )}

          {categories.length > 1 && (
            <nav className="sticky top-14 z-10 -mx-4 mb-4 flex gap-2 overflow-x-auto bg-surface-sunken/95 px-4 py-2 backdrop-blur">
              {categories.map((c) => (
                <a
                  key={c.id}
                  href={`#categoria-${c.id}`}
                  className="shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-ink hover:border-accent hover:text-accent"
                >
                  {c.name}
                </a>
              ))}
            </nav>
          )}

          {categories.length === 0 && (
            <div className="card px-6 py-12 text-center text-ink-muted">Este restaurante ainda não tem itens no cardápio.</div>
          )}

          {categories.map((category) => (
            <section key={category.id} id={`categoria-${category.id}`} className="mb-8 scroll-mt-28">
              <h2 className="mb-3 text-lg font-semibold text-ink">{category.name}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {category.products.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!restaurant.open}
                    onClick={() => setSelected(item)}
                    className="card flex gap-3 p-4 text-left transition-colors enabled:hover:border-accent/50"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-ink">{item.name}</h3>
                      {item.description && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{item.description}</p>}
                      <p className="mt-2 font-semibold text-ink">{formatMoney(item.price)}</p>
                    </div>
                    <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-alt text-4xl">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="size-full object-cover" />
                      ) : (
                        (item.emoji ?? '🍽️')
                      )}
                      {restaurant.open && (
                        <span className="absolute right-1 bottom-1 flex size-6 items-center justify-center rounded-full bg-accent text-accent-ink shadow">
                          <Plus size={14} />
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="hidden lg:block">
          <div className="card sticky top-20 p-5">
            <CartPanel />
          </div>
        </aside>
      </div>

      {/* Barra do carrinho no celular */}
      {cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface p-3 lg:hidden">
          <button type="button" onClick={() => setCartOpen(true)} className="btn btn-primary w-full justify-between">
            <span className="flex items-center gap-2">
              <ShoppingBag size={16} /> Ver carrinho ({cart.count})
            </span>
            <span>{formatMoney(cart.subtotal)}</span>
          </button>
        </div>
      )}
      {cartOpen && (
        <Modal title="Carrinho" onClose={() => setCartOpen(false)}>
          <CartPanel />
        </Modal>
      )}

      {selected && (
        <AddToCartModal
          item={selected}
          onClose={() => setSelected(null)}
          onAdd={(quantity, notes) => {
            if (cart.add(restaurant, selected, quantity, notes)) return setSelected(null)
            const otherRestaurant = cart.restaurant?.name ?? 'outro restaurante'
            if (window.confirm(`Seu carrinho tem itens de ${otherRestaurant}. Deseja esvaziá-lo e começar um pedido em ${restaurant.name}?`)) {
              cart.replaceWith(restaurant, selected, quantity, notes)
              setSelected(null)
            }
          }}
          willReplaceCart={!cartHere && cart.count > 0}
        />
      )}
    </>
  )
}

function AddToCartModal({
  item,
  onClose,
  onAdd,
  willReplaceCart,
}: {
  item: MenuItem
  onClose: () => void
  onAdd: (quantity: number, notes: string) => void
  willReplaceCart: boolean
}) {
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  return (
    <Modal
      title={item.name}
      onClose={onClose}
      footer={
        <div className="flex w-full items-center gap-3">
          <div className="flex h-10 items-center rounded-lg border border-border">
            <button
              type="button"
              className="flex size-10 items-center justify-center text-accent disabled:opacity-40"
              onClick={() => setQuantity((q) => q - 1)}
              disabled={quantity <= 1}
              aria-label="Diminuir quantidade"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center font-semibold" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              className="flex size-10 items-center justify-center text-accent"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              aria-label="Aumentar quantidade"
            >
              <Plus size={16} />
            </button>
          </div>
          <button type="button" className="btn btn-primary flex-1 justify-between" onClick={() => onAdd(quantity, notes)}>
            <span>Adicionar</span>
            <span>{formatMoney(item.price * quantity)}</span>
          </button>
        </div>
      }
    >
      <div className="mb-4 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-surface-alt text-7xl">
        {item.imageUrl ? <img src={item.imageUrl} alt="" className="size-full object-cover" /> : (item.emoji ?? '🍽️')}
      </div>
      {item.description && <p className="text-sm text-ink-muted">{item.description}</p>}
      <p className="mt-2 text-lg font-semibold text-ink">{formatMoney(item.price)}</p>
      <label className="label mt-4">
        Alguma observação?
        <textarea
          className="input min-h-20 resize-y"
          placeholder="Ex.: sem cebola, molho à parte…"
          maxLength={300}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      {willReplaceCart && (
        <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
          Seu carrinho tem itens de outro restaurante. Ao adicionar, vamos perguntar se deseja substituí-los.
        </p>
      )}
    </Modal>
  )
}
