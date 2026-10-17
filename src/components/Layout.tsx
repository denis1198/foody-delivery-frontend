import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <NavLink to="/" className="brand">
            🍔 Foody Delivery
          </NavLink>
          <nav className="nav">
            <NavLink to="/" end>
              Pedidos
            </NavLink>
            <NavLink to="/pedidos/novo">Novo pedido</NavLink>
          </nav>
          <div className="user">
            <span className="muted">Olá, {user?.name}</span>
            <button className="btn btn-ghost" onClick={logout}>
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  )
}
