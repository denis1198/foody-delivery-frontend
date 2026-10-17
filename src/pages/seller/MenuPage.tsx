import { Check, FolderPlus, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { sellerApi } from '../../api/seller'
import type { SellerMenu, SellerProduct } from '../../api/types'
import { formatMoney, formatPercent } from '../../format'
import { estimateMargin, marginTone } from '../../utils/margin'
import { ProductModal } from './ProductModal'

export function MenuPage() {
  const [menu, setMenu] = useState<SellerMenu | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ product: SellerProduct | null; categoryId: number } | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    sellerApi
      .menu()
      .then((data) => active && setMenu(data))
      .catch((err) => active && setError(err instanceof ApiError ? err.message : 'Erro ao carregar o cardápio.'))
    return () => {
      active = false
    }
  }, [refreshKey])

  const reload = () => setRefreshKey((k) => k + 1)

  async function run(action: () => Promise<unknown>) {
    setError(null)
    try {
      await action()
      reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível concluir a ação.')
    }
  }

  async function addCategory(e: FormEvent) {
    e.preventDefault()
    if (!newCategory.trim()) return
    await run(() => sellerApi.createCategory(newCategory.trim()))
    setNewCategory('')
  }

  if (!menu) {
    return error ? <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : <p className="py-12 text-center text-sm text-ink-muted">Carregando cardápio…</p>
  }

  const allProducts = menu.categories.flatMap((c) => c.products)
  const margins = allProducts.map((p) => estimateMargin(p.price, p.costPrice, menu.fees).margin)
  const avgMargin = margins.length ? margins.reduce((a, b) => a + b, 0) / margins.length : 0
  const lowMargin = margins.filter((m) => m < 15).length

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Cardápio</h1>
          <p className="text-sm text-ink-muted">Monte as categorias e os produtos que os clientes veem.</p>
        </div>
        <form onSubmit={addCategory} className="flex gap-2">
          <input
            className="input w-48"
            placeholder="Nova categoria"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            maxLength={80}
            required
            pattern=".*\S.*"
            title="Digite o nome da categoria"
            aria-label="Nome da nova categoria"
          />
          <button className="btn btn-primary">
            <FolderPlus size={16} /> Adicionar categoria
          </button>
        </form>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Produtos" value={String(allProducts.length)} />
        <Kpi label="Disponíveis agora" value={`${allProducts.filter((p) => p.available).length} de ${allProducts.length}`} />
        <Kpi label="Margem média estimada" value={formatPercent(Math.round(avgMargin * 10) / 10)} />
        <Kpi label="Com margem baixa (<15%)" value={String(lowMargin)} tone={lowMargin > 0 ? 'text-danger' : undefined} />
      </div>

      {error && <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      {menu.categories.length === 0 && (
        <div className="card px-6 py-12 text-center text-ink-muted">
          Seu cardápio está vazio. Digite o nome de uma categoria no campo <strong className="text-ink">Nova categoria</strong>{' '}
          acima (por exemplo, “Lanches” ou “Bebidas”) e clique em <strong className="text-ink">Adicionar categoria</strong>.
          Depois, use o botão <strong className="text-ink">+ Produto</strong> de cada categoria.
        </div>
      )}

      <div className="flex flex-col gap-6">
        {menu.categories.map((category) => (
          <section key={category.id} className="card overflow-hidden">
            <CategoryHeader
              name={category.name}
              count={category.products.length}
              onRename={(name) => run(() => sellerApi.updateCategory(category.id, name, category.position))}
              onDelete={() => {
                if (window.confirm(`Excluir a categoria "${category.name}"?`)) run(() => sellerApi.deleteCategory(category.id))
              }}
              onAddProduct={() => setEditing({ product: null, categoryId: category.id })}
            />
            {category.products.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-muted">Nenhum produto nesta categoria.</p>
            ) : (
              <ul className="divide-y divide-border">
                {category.products.map((product) => {
                  const m = estimateMargin(product.price, product.costPrice, menu.fees)
                  return (
                    <li key={product.id} className={`flex flex-wrap items-center gap-3 px-5 py-3 sm:flex-nowrap ${product.available ? '' : 'opacity-60'}`}>
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-2xl">
                        {product.emoji ?? '🍽️'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{product.name}</p>
                        <p className="truncate text-xs text-ink-muted">{product.description ?? 'Sem descrição'}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <p className="font-semibold text-ink">{formatMoney(product.price)}</p>
                          <p className="text-xs text-ink-muted">custo {formatMoney(product.costPrice)}</p>
                        </div>
                        <span
                          className={`w-16 rounded-full px-2 py-0.5 text-center text-xs font-semibold ${marginTone(m.margin)}`}
                          title={`Lucro estimado de ${formatMoney(m.profit)} por unidade`}
                        >
                          {formatPercent(Math.round(m.margin))}
                        </span>
                        <Toggle
                          checked={product.available}
                          label={product.available ? 'Disponível' : 'Esgotado'}
                          onChange={(available) => run(() => sellerApi.setAvailability(product.id, available))}
                        />
                        <button
                          type="button"
                          className="flex size-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt hover:text-ink"
                          onClick={() => setEditing({ product, categoryId: category.id })}
                          aria-label={`Editar ${product.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="flex size-8 items-center justify-center rounded-lg text-ink-muted hover:bg-danger-soft hover:text-danger"
                          onClick={() => {
                            if (window.confirm(`Remover "${product.name}" do cardápio?`)) run(() => sellerApi.archiveProduct(product.id))
                          }}
                          aria-label={`Remover ${product.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        ))}
      </div>

      {editing && (
        <ProductModal
          product={editing.product}
          categories={menu.categories}
          defaultCategoryId={editing.categoryId}
          fees={menu.fees}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </>
  )
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`text-xl font-semibold ${tone ?? 'text-ink'}`}>{value}</p>
    </div>
  )
}

function CategoryHeader({
  name,
  count,
  onRename,
  onDelete,
  onAddProduct,
}: {
  name: string
  count: number
  onRename: (name: string) => void
  onDelete: () => void
  onAddProduct: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-alt px-5 py-3">
      {editing ? (
        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (value.trim()) onRename(value.trim())
            setEditing(false)
          }}
        >
          <input className="input h-8 max-w-xs py-1" value={value} onChange={(e) => setValue(e.target.value)} autoFocus maxLength={80} />
          <button className="flex size-8 items-center justify-center rounded-lg text-success hover:bg-success-soft" aria-label="Salvar nome">
            <Check size={16} />
          </button>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface"
            onClick={() => {
              setValue(name)
              setEditing(false)
            }}
            aria-label="Cancelar"
          >
            <X size={16} />
          </button>
        </form>
      ) : (
        <h2 className="flex flex-1 items-center gap-2 font-semibold text-ink">
          {name} <span className="text-xs font-normal text-ink-muted">({count})</span>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-lg text-ink-muted hover:bg-surface hover:text-ink"
            onClick={() => setEditing(true)}
            aria-label={`Renomear ${name}`}
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-lg text-ink-muted hover:bg-danger-soft hover:text-danger"
            onClick={onDelete}
            aria-label={`Excluir categoria ${name}`}
          >
            <Trash2 size={13} />
          </button>
        </h2>
      )}
      <button type="button" className="btn btn-primary btn-sm" onClick={onAddProduct}>
        <Plus size={14} /> Produto
      </button>
    </header>
  )
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-success' : 'bg-border'}`}
    >
      <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  )
}
