export const ORDER_STATUSES = [
  'RECEBIDO',
  'EM_PREPARO',
  'SAIU_PARA_ENTREGA',
  'ENTREGUE',
  'CANCELADO',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export interface User {
  id: number
  name: string
  email: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Address {
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  zipCode: string
}

export interface OrderItem {
  id: number
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Order {
  id: number
  customerName: string
  deliveryAddress: Address
  items: OrderItem[]
  total: number
  status: OrderStatus
  nextStatuses: OrderStatus[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CreateOrderRequest {
  customerName: string
  deliveryAddress: Omit<Address, 'complement'> & { complement?: string }
  items: { productName: string; quantity: number; unitPrice: number }[]
}
