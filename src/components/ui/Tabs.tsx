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
      className="flex gap-1 overflow-x-auto rounded-card border border-line bg-surface/90 p-1 shadow-card [scrollbar-width:none]"
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
              'inline-flex shrink-0 items-center gap-1.5 rounded-btn px-3.5 py-2 text-xs font-bold tracking-wider uppercase transition',
              selected ? 'bg-cp-green/10 text-cp-green shadow-[inset_0_0_0_1px_rgb(0_255_0/0.5),0_0_14px_rgb(0_255_0/0.2)]' : 'text-muted hover:bg-cp-green/5 hover:text-cp-green',
            )}
          >
            {t.icon}
            {t.label}
            {t.badge ? (
              <span className="ml-0.5 rounded-btn bg-cp-magenta px-1.5 text-[11px] leading-[18px] font-bold text-black">
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
