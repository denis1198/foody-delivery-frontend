import { Store, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../../api/client'
import type { Role } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import { AuthCard } from '../../components/AuthCard'
import { RESTAURANT_CATEGORIES } from '../../format'

export function RegisterPage() {
  const { register } = useAuth()
  const [role, setRole] = useState<Role>('CUSTOMER')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    restaurantName: '',
    restaurantCategory: RESTAURANT_CATEGORIES[0].name,
  })
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const set = (field: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [field]: e.target.value })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        ...(role === 'SELLER' && {
          restaurantName: form.restaurantName,
          restaurantCategory: form.restaurantCategory,
        }),
      })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setFieldErrors(err.fieldErrors)
      } else {
        setError('Erro inesperado.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const fieldError = (name: string) =>
    fieldErrors[name] && <span className="text-xs font-normal text-danger">{fieldErrors[name]}</span>

  return (
    <AuthCard title="Criar conta">
      <div className="mb-5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de conta">
        <RoleOption icon={UtensilsCrossed} title="Quero pedir" text="Sou cliente" active={role === 'CUSTOMER'} onClick={() => setRole('CUSTOMER')} />
        <RoleOption icon={Store} title="Tenho um restaurante" text="Sou vendedor" active={role === 'SELLER'} onClick={() => setRole('SELLER')} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="label">
          Seu nome
          <input className="input" value={form.name} onChange={set('name')} required maxLength={120} autoFocus />
          {fieldError('name')}
        </label>
        <label className="label">
          E-mail
          <input className="input" type="email" value={form.email} onChange={set('email')} required />
          {fieldError('email')}
        </label>
        <label className="label">
          Senha
          <input className="input" type="password" value={form.password} onChange={set('password')} required minLength={6} />
          <span className="text-xs font-normal text-ink-muted">Mínimo de 6 caracteres.</span>
          {fieldError('password')}
        </label>

        {role === 'SELLER' && (
          <div className="grid gap-4 rounded-lg border border-accent/30 bg-accent-soft/50 p-4 sm:grid-cols-2">
            <label className="label sm:col-span-2">
              Nome do restaurante
              <input className="input" value={form.restaurantName} onChange={set('restaurantName')} required maxLength={120} />
              {fieldError('restaurantName')}
            </label>
            <label className="label sm:col-span-2">
              Categoria
              <select className="input" value={form.restaurantCategory} onChange={set('restaurantCategory')}>
                {RESTAURANT_CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Criando conta…' : role === 'SELLER' ? 'Criar conta e restaurante' : 'Criar conta'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-ink-muted">
        Já tem conta?{' '}
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Entrar
        </Link>
      </p>
    </AuthCard>
  )
}

function RoleOption({
  icon: Icon,
  title,
  text,
  active,
  onClick,
}: {
  icon: LucideIcon
  title: string
  text: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
        active ? 'border-accent bg-accent-soft text-accent' : 'border-border text-ink hover:bg-surface-alt'
      }`}
    >
      <Icon size={18} />
      <span className="text-sm font-semibold">{title}</span>
      <span className={`text-xs ${active ? 'text-accent/80' : 'text-ink-muted'}`}>{text}</span>
    </button>
  )
}
