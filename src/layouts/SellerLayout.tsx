import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { ApiError } from '../api/client'
import { sellerApi } from '../api/seller'
import type { RestaurantSettings } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { ThemeToggle } from '../components/ThemeToggle'
import type { SellerOutletContext } from './sellerContext'

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/painel', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/painel/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/painel/cardapio', label: 'Cardápio', icon: BookOpen },
  { to: '/painel/configuracoes', label: 'Configurações', icon: Settings },
]

const COLLAPSED_KEY = 'foody.sidebar.collapsed'

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export function SellerLayout() {
  const { user, logout } = useAuth()
  const [restaurant, setRestaurant] = useState<RestaurantSettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    sellerApi
      .restaurant()
      .then(setRestaurant)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro ao carregar o restaurante.'))
  }, [])

  function toggleCollapsed() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, c ? '0' : '1')
      } catch {
        // ignora: só não lembra a preferência
      }
      return !c
    })
  }

  async function toggleOpen() {
    if (!restaurant) return
    setToggling(true)
    try {
      setRestaurant(await sellerApi.setOpen(!restaurant.open))
    } finally {
      setToggling(false)
    }
  }

  const context: SellerOutletContext | null = restaurant ? { restaurant, setRestaurant } : null

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] lg:flex ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <span className="text-xl">🍔</span>
          {!collapsed && (
            <span className="font-bold whitespace-nowrap text-ink">
              Foody <span className="text-accent">Parceiros</span>
            </span>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-accent-soft text-accent' : 'text-ink-muted hover:bg-surface-alt hover:text-ink'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="m-2 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-surface-alt hover:text-ink"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed && 'Recolher'}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
          {restaurant ? (
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-xl">{restaurant.logoEmoji}</span>
              <span className="truncate font-semibold text-ink">{restaurant.name}</span>
            </div>
          ) : (
            <span className="text-sm text-ink-muted">Carregando…</span>
          )}
          {restaurant && (
            <button
              type="button"
              onClick={toggleOpen}
              disabled={toggling}
              className={`ml-1 flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                restaurant.open
                  ? 'border-success/30 bg-success-soft text-success'
                  : 'border-border bg-surface-alt text-ink-muted'
              }`}
              title={restaurant.open ? 'Clique para fechar a loja' : 'Clique para abrir a loja'}
            >
              <span className={`size-2 rounded-full ${restaurant.open ? 'bg-success' : 'bg-ink-muted'}`} />
              {restaurant.open ? 'Aberto' : 'Fechado'}
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            <span className="mr-2 hidden text-sm text-ink-muted md:inline">{user?.name}</span>
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
        </header>

        <main className="mx-auto w-full flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-6 min-[1440px]:max-w-[1400px]">
          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
          {context && <Outlet context={context} />}
        </main>
      </div>

      {/* Tab bar (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-surface lg:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-accent' : 'text-ink-muted'}`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
