import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { GuestOnly, RequireRole } from './auth/RequireAuth'
import { CartProvider } from './cart/CartProvider'
import { CheckoutPage } from './pages/customer/CheckoutPage'
import { MyOrderDetailPage } from './pages/customer/MyOrderDetailPage'
import { MyOrdersPage } from './pages/customer/MyOrdersPage'
import { RestaurantPage } from './pages/customer/RestaurantPage'
import { RestaurantsPage } from './pages/customer/RestaurantsPage'
import { MenuPage } from './pages/seller/MenuPage'
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage'
import { SettingsPage } from './pages/seller/SettingsPage'
import { CustomerLayout } from './layouts/CustomerLayout'
import { SellerLayout } from './layouts/SellerLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ThemeProvider } from './theme/ThemeProvider'

// Recharts só é baixado por quem abre a dashboard (vendedores).
const DashboardPage = lazy(() => import('./pages/seller/DashboardPage').then((m) => ({ default: m.DashboardPage })))

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<GuestOnly />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cadastro" element={<RegisterPage />} />
            </Route>

            <Route element={<RequireRole role="CUSTOMER" />}>
              <Route
                element={
                  <CartProvider>
                    <CustomerLayout />
                  </CartProvider>
                }
              >
                <Route path="/" element={<RestaurantsPage />} />
                <Route path="/restaurantes/:id" element={<RestaurantPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/meus-pedidos" element={<MyOrdersPage />} />
                <Route path="/meus-pedidos/:id" element={<MyOrderDetailPage />} />
              </Route>
            </Route>

            <Route path="/painel" element={<RequireRole role="SELLER" />}>
              <Route element={<SellerLayout />}>
                <Route
                  index
                  element={
                    <Suspense fallback={<p className="py-24 text-center text-sm text-ink-muted">Carregando dashboard…</p>}>
                      <DashboardPage />
                    </Suspense>
                  }
                />
                <Route path="pedidos" element={<SellerOrdersPage />} />
                <Route path="cardapio" element={<MenuPage />} />
                <Route path="configuracoes" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
