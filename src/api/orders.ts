import { api } from './client'
import type { CreateOrderRequest, Menu, Order, Restaurant } from './types'

/** Chamadas da área do cliente. */
export const customerApi = {
  restaurants: (params: { category?: string; q?: string } = {}) => {
    const query = new URLSearchParams()
    if (params.category) query.set('category', params.category)
    if (params.q) query.set('q', params.q)
    const qs = query.toString()
    return api<Restaurant[]>(`/api/restaurants${qs ? `?${qs}` : ''}`)
  },
  menu: (restaurantId: number) => api<Menu>(`/api/restaurants/${restaurantId}`),
  createOrder: (order: CreateOrderRequest) => api<Order>('/api/orders', { method: 'POST', body: order }),
  myOrders: () => api<Order[]>('/api/orders/mine'),
  order: (id: number) => api<Order>(`/api/orders/${id}`),
  cancel: (id: number) => api<Order>(`/api/orders/${id}/cancel`, { method: 'PATCH' }),
}
