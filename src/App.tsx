import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { GuestOnly, RequireRole } from './auth/RequireAuth'
import { CustomerLayout } from './layouts/CustomerLayout'
import { SellerLayout } from './layouts/SellerLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ThemeProvider } from './theme/ThemeProvider'

function Soon({ title }: { title: string }) {
  return <h1 className="text-xl font-semibold text-ink">{title}</h1>
}

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
              <Route element={<CustomerLayout />}>
                <Route path="/" element={<Soon title="Restaurantes" />} />
                <Route path="/meus-pedidos" element={<Soon title="Meus pedidos" />} />
              </Route>
            </Route>

            <Route path="/painel" element={<RequireRole role="SELLER" />}>
              <Route element={<SellerLayout />}>
                <Route index element={<Soon title="Dashboard" />} />
                <Route path="pedidos" element={<Soon title="Pedidos" />} />
                <Route path="cardapio" element={<Soon title="Cardápio" />} />
                <Route path="configuracoes" element={<Soon title="Configurações" />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
