import { LogOut, Receipt, ShoppingBag, Store } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import { ThemeToggle } from '../components/ThemeToggle'

export function CustomerLayout() {
  const { user, logout } = useAuth()
  const cart = useCart()

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-accent-soft text-accent' : 'text-ink-muted hover:bg-surface-alt hover:text-ink'
    }`

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-1.5 font-bold text-ink">
            <span className="text-xl">🍔</span>
            <span className="hidden sm:inline">
              Foody <span className="text-accent">Delivery</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              <Store size={16} />
              <span className="hidden sm:inline">Restaurantes</span>
            </NavLink>
            <NavLink to="/meus-pedidos" className={navClass}>
              <Receipt size={16} />
              <span className="hidden sm:inline">Meus pedidos</span>
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/checkout"
              className="relative flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt hover:text-ink"
              aria-label={`Carrinho com ${cart.count} itens`}
              title="Carrinho"
            >
              <ShoppingBag size={18} />
              {cart.count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-ink">
                  {cart.count}
                </span>
              )}
            </Link>
            <span className="mx-2 hidden text-sm text-ink-muted md:inline">Olá, {user?.name.split(' ')[0]}</span>
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt hover:text-ink"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28">
        <Outlet />
      </main>
    </div>
  )
}
