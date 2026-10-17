import type { ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-3xl">🍔</div>
          <div className="mt-1 text-xl font-bold text-ink">
            Foody <span className="text-accent">Delivery</span>
          </div>
        </div>
        <div className="card p-6">
          <h1 className="text-xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  )
}
