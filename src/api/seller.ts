import { api } from './client'
import type {
  Dashboard,
  Order,
  OrderStatus,
  ProductRequest,
  RestaurantSettings,
  RestaurantSettingsRequest,
  SellerCategory,
  SellerMenu,
  SellerProduct,
} from './types'

/** Chamadas do painel do vendedor (/api/seller/**). */
export const sellerApi = {
  restaurant: () => api<RestaurantSettings>('/api/seller/restaurant'),
  updateRestaurant: (body: RestaurantSettingsRequest) =>
    api<RestaurantSettings>('/api/seller/restaurant', { method: 'PUT', body }),
  setOpen: (open: boolean) => api<RestaurantSettings>('/api/seller/restaurant/open', { method: 'PATCH', body: { open } }),

  menu: () => api<SellerMenu>('/api/seller/menu'),
  createCategory: (name: string) =>
    api<SellerCategory>('/api/seller/menu/categories', { method: 'POST', body: { name } }),
  updateCategory: (id: number, name: string, position?: number) =>
    api<SellerCategory>(`/api/seller/menu/categories/${id}`, { method: 'PUT', body: { name, position } }),
  deleteCategory: (id: number) => api<void>(`/api/seller/menu/categories/${id}`, { method: 'DELETE' }),
  createProduct: (body: ProductRequest) =>
    api<SellerProduct>('/api/seller/menu/products', { method: 'POST', body }),
  updateProduct: (id: number, body: ProductRequest) =>
    api<SellerProduct>(`/api/seller/menu/products/${id}`, { method: 'PUT', body }),
  setAvailability: (id: number, available: boolean) =>
    api<SellerProduct>(`/api/seller/menu/products/${id}/availability`, { method: 'PATCH', body: { available } }),
  archiveProduct: (id: number) => api<void>(`/api/seller/menu/products/${id}`, { method: 'DELETE' }),

  orders: () => api<Order[]>('/api/seller/orders'),
  order: (id: number) => api<Order>(`/api/seller/orders/${id}`),
  updateStatus: (id: number, status: OrderStatus) =>
    api<Order>(`/api/seller/orders/${id}/status`, { method: 'PATCH', body: { status } }),

  dashboard: (from: string, to: string) => api<Dashboard>(`/api/seller/dashboard?from=${from}&to=${to}`),
}
