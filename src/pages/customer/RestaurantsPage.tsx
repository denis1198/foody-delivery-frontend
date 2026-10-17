import { Bike, Clock, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../../api/client'
import { customerApi } from '../../api/orders'
import type { Restaurant } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import { formatMoney, RESTAURANT_CATEGORIES } from '../../format'

export function RestaurantsPage() {
  const { user } = useAuth()
  const [category, setCategory] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [restaurants, setRestaurants] = useState<Restaurant[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    let active = true
    customerApi
      .restaurants({ category: category ?? undefined, q: debounced || undefined })
      .then((data) => {
        if (!active) return
        setRestaurants(data)
        setError(null)
      })
      .catch((err) => active && setError(err instanceof ApiError ? err.message : 'Erro ao carregar restaurantes.'))
    return () => {
      active = false
    }
  }, [category, debounced])

  return (
    <>
      <section className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-accent-hover px-6 py-8 text-white shadow-card sm:px-10">
        <p className="text-sm font-medium opacity-90">Olá, {user?.name.split(' ')[0]} 👋</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">O que vamos pedir hoje?</h1>
        <div className="relative mt-5 max-w-xl">
          <Search size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" />
          <input
            className="input h-11 pl-10 text-base text-ink"
            placeholder="Buscar restaurante ou tipo de comida"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar restaurantes"
          />
        </div>
      </section>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Categorias">
        <CategoryChip active={category === null} onClick={() => setCategory(null)} emoji="🍽️" label="Todos" />
        {RESTAURANT_CATEGORIES.map((c) => (
          <CategoryChip
            key={c.name}
            active={category === c.name}
            onClick={() => setCategory(category === c.name ? null : c.name)}
            emoji={c.emoji}
            label={c.name}
          />
        ))}
      </div>

      {error && <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      {restaurants === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card h-28 animate-pulse bg-surface-alt" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="card px-6 py-12 text-center text-ink-muted">Nenhum restaurante encontrado.</div>
      ) : (
        <>
          <h2 className="mb-3 text-lg font-semibold text-ink">
            {category ?? 'Restaurantes'} <span className="text-sm font-normal text-ink-muted">({restaurants.length})</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        </>
      )}
    </>
  )
}

function CategoryChip({ active, onClick, emoji, label }: { active: boolean; onClick: () => void; emoji: string; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex shrink-0 flex-col items-center gap-1 rounded-xl border px-4 py-2.5 text-xs font-medium transition-colors ${
        active ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-surface text-ink hover:bg-surface-alt'
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      {label}
    </button>
  )
}

function RestaurantCard({ restaurant: r }: { restaurant: Restaurant }) {
  return (
    <Link
      to={`/restaurantes/${r.id}`}
      className={`card flex gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-accent/50 ${r.open ? '' : 'opacity-60 grayscale'}`}
    >
      <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-4xl">{r.logoEmoji}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-ink">{r.name}</h3>
          {!r.open && (
            <span className="shrink-0 rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold text-ink-muted">Fechado</span>
          )}
        </div>
        <p className="text-sm text-ink-muted">{r.category}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {r.prepTimeMin}–{r.prepTimeMax} min
          </span>
          <span className={`flex items-center gap-1 ${r.deliveryFee === 0 ? 'font-semibold text-success' : ''}`}>
            <Bike size={12} /> {r.deliveryFee === 0 ? 'Entrega grátis' : formatMoney(r.deliveryFee)}
          </span>
        </div>
      </div>
    </Link>
  )
}
