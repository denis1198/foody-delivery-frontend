export const ORDER_STATUSES = [
  'RECEBIDO',
  'EM_PREPARO',
  'SAIU_PARA_ENTREGA',
  'ENTREGUE',
  'CANCELADO',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]
export type Role = 'CUSTOMER' | 'SELLER'
export type PaymentMethod = 'PIX' | 'CARTAO' | 'DINHEIRO'

export interface User {
  id: number
  name: string
  email: string
  role: Role
}

export interface AuthResponse {
  token: string
  user: User
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: Role
  restaurantName?: string
  restaurantCategory?: string
}

// ---- Restaurantes e cardápio -------------------------------------------------------------------

export interface Restaurant {
  id: number
  name: string
  category: string
  description: string | null
  logoEmoji: string
  deliveryFee: number
  prepTimeMin: number
  prepTimeMax: number
  open: boolean
}

export interface MenuItem {
  id: number
  name: string
  description: string | null
  price: number
  emoji: string | null
  imageUrl: string | null
}

export interface Menu {
  restaurant: Restaurant
  categories: { id: number; name: string; products: MenuItem[] }[]
}

export interface RestaurantSettings extends Restaurant {
  commissionPercent: number
  paymentFeePercent: number
  taxPercent: number
}

export type RestaurantSettingsRequest = Omit<RestaurantSettings, 'id' | 'open'>

export interface Fees {
  commissionPercent: number
  paymentFeePercent: number
  taxPercent: number
}

export interface SellerProduct {
  id: number
  categoryId: number | null
  name: string
  description: string | null
  price: number
  costPrice: number
  emoji: string | null
  imageUrl: string | null
  available: boolean
  position: number
}

export interface SellerCategory {
  id: number
  name: string
  position: number
  products: SellerProduct[]
}

export interface SellerMenu {
  fees: Fees
  categories: SellerCategory[]
}

export interface ProductRequest {
  categoryId: number
  name: string
  description?: string
  price: number
  costPrice: number
  emoji?: string
  imageUrl?: string
  available: boolean
}

// ---- Pedidos -----------------------------------------------------------------------------------

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
  productId: number | null
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
  notes: string | null
}

export interface OrderFinancials {
  commission: number
  paymentFee: number
  tax: number
  cost: number
  net: number
  profit: number
}

export interface Order {
  id: number
  restaurant: { id: number; name: string; logoEmoji: string }
  customerName: string
  deliveryAddress: Address
  items: OrderItem[]
  paymentMethod: PaymentMethod
  notes: string | null
  subtotal: number
  deliveryFee: number
  total: number
  status: OrderStatus
  nextStatuses: OrderStatus[]
  financials: OrderFinancials | null
  createdAt: string
  updatedAt: string
}

export interface CreateOrderRequest {
  restaurantId: number
  items: { productId: number; quantity: number; notes?: string }[]
  deliveryAddress: Omit<Address, 'complement'> & { complement?: string }
  paymentMethod: PaymentMethod
  notes?: string
}

// ---- Dashboard ---------------------------------------------------------------------------------

export interface DashboardSummary {
  revenue: number
  net: number
  profit: number
  margin: number
  salesCount: number
  itemsSold: number
  averageTicket: number
  cancelledCount: number
  cancelledRevenue: number
  commission: number
  paymentFees: number
  taxes: number
  cost: number
  deliveryFees: number
  roi: number
}

export interface DayPoint {
  day: string
  orders: number
  revenue: number
  net: number
  profit: number
}

export interface Dashboard {
  period: { from: string; to: string; days: number; comparedUntilNow: boolean }
  summary: DashboardSummary
  previous: DashboardSummary
  revenueByDay: DayPoint[]
  ordersByHour: { hour: number; orders: number; revenue: number }[]
  weekdays: {
    weekday: number
    label: string
    occurrences: number
    orders: number
    revenue: number
    avgOrders: number
    avgRevenue: number
  }[]
  weakestDays: DayPoint[]
  topProducts: {
    productId: number | null
    productName: string
    unitsSold: number
    revenue: number
    share: number
    avgPrice: number
    avgCost: number
    profit: number
    margin: number
  }[]
  statusBreakdown: { status: OrderStatus; count: number }[]
}
