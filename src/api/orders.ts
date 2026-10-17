import { api } from './client'
import type { CreateOrderRequest, Order, OrderStatus } from './types'

export const ordersApi = {
  list: () => api<Order[]>('/api/orders'),
  get: (id: number) => api<Order>(`/api/orders/${id}`),
  create: (order: CreateOrderRequest) => api<Order>('/api/orders', { method: 'POST', body: order }),
  updateStatus: (id: number, status: OrderStatus) =>
    api<Order>(`/api/orders/${id}/status`, { method: 'PATCH', body: { status } }),
}
