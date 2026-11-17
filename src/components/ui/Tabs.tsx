import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface TabItem<K extends string> {
  key: K
  label: string
  icon?: ReactNode
  badge?: number
}

/**
 * WAI-ARIA tabs with roving tabindex: ←/→ move, Home/End jump, focus follows selection.
 * Panels are rendered by the caller using `tabPanelProps`.
 */
export function TabList<K extends string>({
  items,
  active,
  onChange,
  idBase,
  label,
}: {
  items: readonly TabItem<K>[]
  active: K
  onChange: (key: K) => void
  idBase: string
  label: string
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Keep the selected tab visible in the horizontally scrolling list on small screens.
  useEffect(() => {
    const el = refs.current[active]
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [active])

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const i = items.findIndex((t) => t.key === active)
    let next = i
    if (e.key === 'ArrowRight') next = (i + 1) % items.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else return
    e.preventDefault()
    const item = items[next]
    if (!item) return
    onChange(item.key)
    refs.current[item.key]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="flex gap-1 overflow-x-auto rounded-2xl border border-line-soft bg-white/80 p-1 shadow-card [scrollbar-width:none]"
    >
      {items.map((t) => {
        const selected = t.key === active
        return (
          <button
            key={t.key}
            ref={(el) => {
              refs.current[t.key] = el
            }}
            type="button"
            role="tab"
            id={`${idBase}-tab-${t.key}`}
            aria-selected={selected}
            aria-controls={`${idBase}-panel-${t.key}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.key)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition',
              selected ? 'bg-lilac-50 text-violet shadow-[inset_0_0_0_1px_rgb(109_90_230/0.15)]' : 'text-muted hover:bg-lilac-50/60 hover:text-violet',
            )}
          >
            {t.icon}
            {t.label}
            {t.badge ? (
              <span className="ml-0.5 rounded-full bg-rose px-1.5 text-[11px] leading-[18px] font-semibold text-white">
                <span className="sr-only">, </span>
                {t.badge}
                <span className="sr-only"> unread</span>
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
