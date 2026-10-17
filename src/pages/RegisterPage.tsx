import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { AuthCard } from '../components/AuthCard'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const set = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/', { replace: true })
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

  return (
    <AuthCard title="Criar conta">
      <form onSubmit={handleSubmit} className="form">
        <label>
          Nome
          <input value={form.name} onChange={set('name')} required maxLength={120} autoFocus />
          {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
        </label>
        <label>
          E-mail
          <input type="email" value={form.email} onChange={set('email')} required />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </label>
        <label>
          Senha
          <input type="password" value={form.password} onChange={set('password')} required minLength={6} />
          <span className="hint">Mínimo de 6 caracteres.</span>
          {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
        </label>
        {error && <p className="alert">{error}</p>}
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Criando conta…' : 'Cadastrar'}
        </button>
      </form>
      <p className="muted small">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </AuthCard>
  )
}
