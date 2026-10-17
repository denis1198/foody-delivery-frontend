import { Bike, Check, ChefHat, Inbox, PackageCheck, X, type LucideIcon } from 'lucide-react'
import type { OrderStatus } from '../api/types'
import { STATUS_LABELS } from '../format'

const STEPS: { status: OrderStatus; icon: LucideIcon }[] = [
  { status: 'RECEBIDO', icon: Inbox },
  { status: 'EM_PREPARO', icon: ChefHat },
  { status: 'SAIU_PARA_ENTREGA', icon: Bike },
  { status: 'ENTREGUE', icon: PackageCheck },
]

/** Linha do tempo do pedido para o cliente acompanhar. */
export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === 'CANCELADO') {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-danger-soft px-4 py-3 text-danger">
        <X size={20} />
        <span className="font-semibold">Pedido cancelado</span>
      </div>
    )
  }

  const current = STEPS.findIndex((s) => s.status === status)
  return (
    <ol className="grid grid-cols-4">
      {STEPS.map(({ status: step, icon: Icon }, i) => {
        const done = i < current || status === 'ENTREGUE'
        const active = i === current && status !== 'ENTREGUE'
        return (
          <li key={step} className="flex flex-col items-center gap-2 text-center">
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? 'invisible' : i <= current ? 'bg-accent' : 'bg-border'}`} />
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 ${
                  done
                    ? 'border-accent bg-accent text-accent-ink'
                    : active
                      ? 'animate-pulse border-accent bg-accent-soft text-accent'
                      : 'border-border bg-surface text-ink-muted'
                }`}
              >
                {done ? <Check size={18} /> : <Icon size={18} />}
              </span>
              <span
                className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? 'invisible' : i < current ? 'bg-accent' : 'bg-border'}`}
              />
            </div>
            <span className={`text-xs ${i <= current ? 'font-semibold text-ink' : 'text-ink-muted'}`}>{STATUS_LABELS[step]}</span>
          </li>
        )
      })}
    </ol>
  )
}
