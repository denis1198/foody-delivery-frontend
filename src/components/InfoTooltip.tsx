import { Info } from 'lucide-react'
import { useState } from 'react'

/** Popover "Como calculamos", no padrão do Marketplace Manager. */
export function InfoTooltip({
  description,
  rows,
  align = 'center',
}: {
  description: string
  rows?: { label: string; value: string }[]
  align?: 'center' | 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const position = {
    center: 'left-1/2 -translate-x-1/2',
    left: 'left-0',
    right: 'right-0',
  }[align]

  return (
    <span
      className="relative inline-flex shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          setOpen((v) => !v)
        }}
        className="flex items-center text-ink-muted/70 hover:text-accent"
        aria-label="Como calculamos"
      >
        <Info size={12} />
      </button>
      {open && (
        <div
          className={`absolute top-full z-30 mt-2 w-72 max-w-[80vw] rounded-xl border border-border bg-surface p-4 text-left shadow-popover ${position}`}
        >
          <p className="mb-1.5 text-[10px] font-bold tracking-wider text-accent uppercase">Como calculamos</p>
          <p className="text-sm leading-snug font-medium text-ink">{description}</p>
          {rows && rows.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-border pt-3">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-ink-muted">{row.label}</span>
                  <span className="font-medium text-ink">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </span>
  )
}
