import { Store, UtensilsCrossed } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { AuthCard } from '../../components/AuthCard'

const DEMO_PASSWORD = 'demo123'

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // O redirecionamento por papel acontece no GuestOnly assim que o usuário é definido.
  async function signIn(mail: string, pass: string) {
    setError(null)
    setSubmitting(true)
    try {
      await login(mail, pass)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    signIn(email, password)
  }

  return (
    <AuthCard title="Entrar" subtitle="Peça comida ou gerencie seu restaurante.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="label">
          E-mail
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label className="label">
          Senha
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <div className="mt-6 border-t border-border pt-5">
        <p className="mb-3 text-xs font-semibold tracking-wider text-ink-muted uppercase">Contas de demonstração</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={submitting}
            onClick={() => signIn('cliente@foody.com', DEMO_PASSWORD)}
          >
            <UtensilsCrossed size={14} /> Cliente
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={submitting}
            onClick={() => signIn('vendedor@foody.com', DEMO_PASSWORD)}
          >
            <Store size={14} /> Restaurante
          </button>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-ink-muted">
        Não tem conta?{' '}
        <Link to="/cadastro" className="font-semibold text-accent hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthCard>
  )
}
