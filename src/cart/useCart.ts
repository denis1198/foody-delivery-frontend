import { createContext, useContext } from 'react'
import type { MenuItem, Restaurant } from '../api/types'

export interface CartRestaurant {
  id: number
  name: string
  logoEmoji: string
  deliveryFee: number
}

export interface CartLine {
  key: string
  productId: number
  name: string
  emoji: string | null
  price: number
  quantity: number
  notes: string
}

export interface CartState {
  restaurant: CartRestaurant | null
  lines: CartLine[]
  count: number
  subtotal: number
  /** Adiciona ao carrinho. Retorna false se o carrinho é de outro restaurante (nada é alterado). */
  add: (restaurant: Restaurant, item: MenuItem, quantity: number, notes: string) => boolean
  /** Esvazia o carrinho e começa um novo com o item, vindo de outro restaurante. */
  replaceWith: (restaurant: Restaurant, item: MenuItem, quantity: number, notes: string) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
}

export const CartContext = createContext<CartState | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de <CartProvider>')
  return ctx
}
