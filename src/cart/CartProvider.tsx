import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { MenuItem, Restaurant } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { CartContext, type CartLine, type CartRestaurant, type CartState } from './useCart'

interface StoredCart {
  restaurant: CartRestaurant | null
  lines: CartLine[]
}

const EMPTY: StoredCart = { restaurant: null, lines: [] }

function load(key: string): StoredCart {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as StoredCart) : EMPTY
  } catch {
    return EMPTY
  }
}

/** Carrinho de um único restaurante, salvo no navegador por usuário. */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const storageKey = `foody.cart.${user?.id ?? 'anon'}`
  const [cart, setCart] = useState<StoredCart>(() => load(storageKey))

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart))
    } catch {
      // sem localStorage o carrinho só não sobrevive a um recarregamento
    }
  }, [cart, storageKey])

  const toCartRestaurant = (r: Restaurant): CartRestaurant => ({
    id: r.id,
    name: r.name,
    logoEmoji: r.logoEmoji,
    deliveryFee: r.deliveryFee,
  })

  const newLine = (item: MenuItem, quantity: number, notes: string): CartLine => ({
    key: `${item.id}:${notes.trim()}`,
    productId: item.id,
    name: item.name,
    emoji: item.emoji,
    price: item.price,
    quantity,
    notes: notes.trim(),
  })

  const replaceWith = useCallback((restaurant: Restaurant, item: MenuItem, quantity: number, notes: string) => {
    setCart({ restaurant: toCartRestaurant(restaurant), lines: [newLine(item, quantity, notes)] })
  }, [])

  const add = useCallback(
    (restaurant: Restaurant, item: MenuItem, quantity: number, notes: string) => {
      if (cart.restaurant && cart.restaurant.id !== restaurant.id && cart.lines.length > 0) return false
      const line = newLine(item, quantity, notes)
      setCart((current) => {
        const existing = current.lines.find((l) => l.key === line.key)
        const lines = existing
          ? current.lines.map((l) => (l.key === line.key ? { ...l, quantity: Math.min(99, l.quantity + quantity) } : l))
          : [...current.lines, line]
        return { restaurant: toCartRestaurant(restaurant), lines }
      })
      return true
    },
    [cart.restaurant, cart.lines.length],
  )

  const value = useMemo<CartState>(
    () => ({
      restaurant: cart.lines.length > 0 ? cart.restaurant : null,
      lines: cart.lines,
      count: cart.lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: cart.lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
      add,
      replaceWith,
      setQuantity: (key, quantity) =>
        setCart((c) => ({
          ...c,
          lines:
            quantity <= 0
              ? c.lines.filter((l) => l.key !== key)
              : c.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(99, quantity) } : l)),
        })),
      remove: (key) => setCart((c) => ({ ...c, lines: c.lines.filter((l) => l.key !== key) })),
      clear: () => setCart(EMPTY),
    }),
    [cart, add, replaceWith],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
