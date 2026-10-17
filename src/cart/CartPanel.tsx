import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { formatMoney } from '../format'
import { useCart } from './useCart'

/** Resumo do carrinho com controle de quantidade. Usado ao lado do cardápio e no checkout. */
export function CartPanel({ showCheckout = true }: { showCheckout?: boolean }) {
  const cart = useCart()

  if (!cart.restaurant) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-ink-muted">
        <ShoppingBag size={28} className="opacity-60" />
        <p className="text-sm">Seu carrinho está vazio.</p>
      </div>
    )
  }

  const deliveryFee = cart.restaurant.deliveryFee
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">{cart.restaurant.logoEmoji}</span>
        <div className="min-w-0">
          <p className="text-xs text-ink-muted">Seu pedido em</p>
          <Link to={`/restaurantes/${cart.restaurant.id}`} className="block truncate font-semibold text-ink hover:text-accent">
            {cart.restaurant.name}
          </Link>
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-border">
        {cart.lines.map((line) => (
          <li key={line.key} className="flex gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{line.name}</p>
              {line.notes && <p className="text-xs text-ink-muted italic">Obs.: {line.notes}</p>}
              <p className="mt-0.5 text-sm font-semibold text-ink">{formatMoney(line.price * line.quantity)}</p>
            </div>
            <div className="flex h-8 shrink-0 items-center rounded-lg border border-border">
              <button
                type="button"
                className="flex size-8 items-center justify-center text-accent hover:bg-surface-alt"
                onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
                aria-label={line.quantity === 1 ? `Remover ${line.name}` : `Diminuir ${line.name}`}
              >
                {line.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
              </button>
              <span className="w-6 text-center text-sm font-semibold">{line.quantity}</span>
              <button
                type="button"
                className="flex size-8 items-center justify-center text-accent hover:bg-surface-alt"
                onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
                aria-label={`Aumentar ${line.name}`}
              >
                <Plus size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <dl className="space-y-1.5 border-t border-border pt-3 text-sm">
        <div className="flex justify-between text-ink-muted">
          <dt>Subtotal</dt>
          <dd>{formatMoney(cart.subtotal)}</dd>
        </div>
        <div className="flex justify-between text-ink-muted">
          <dt>Taxa de entrega</dt>
          <dd>{deliveryFee > 0 ? formatMoney(deliveryFee) : <span className="text-success">Grátis</span>}</dd>
        </div>
        <div className="flex justify-between pt-1 text-base font-bold text-ink">
          <dt>Total</dt>
          <dd>{formatMoney(cart.subtotal + deliveryFee)}</dd>
        </div>
      </dl>

      {showCheckout && (
        <Link to="/checkout" className="btn btn-primary w-full">
          Finalizar pedido
        </Link>
      )}
    </div>
  )
}
