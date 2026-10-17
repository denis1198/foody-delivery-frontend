import type { ReactNode } from 'react'

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="brand brand-lg">🍔 Foody Delivery</div>
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  )
}
