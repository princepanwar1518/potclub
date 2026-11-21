import { Minus, Square, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type WindowTone = 'accent' | 'violet' | 'warn' | 'info'

const tones: Record<WindowTone, string> = {
  accent: 'bg-accent text-ink',
  violet: 'bg-violet-fill text-white',
  warn: 'bg-warn text-ink',
  info: 'bg-info text-ink',
}

/**
 * Decorative 90s window title bar (title + minimise/maximise/close squares) for featured panels.
 * The squares are decoration only (aria-hidden); real controls must be separate, labelled buttons.
 */
export function WindowBar({ title, tone = 'accent', className }: { title: ReactNode; tone?: WindowTone; className?: string }) {
  return (
    <div className={cn('window-bar rounded-t-[7px] text-sm', tones[tone], className)}>
      <span className="truncate">{title}</span>
      <span aria-hidden="true" className="flex shrink-0 gap-1">
        {[Minus, Square, X].map((Icon, i) => (
          <span key={i} className="inline-flex size-6 items-center justify-center rounded-[4px] border-2 border-ink bg-surface text-ink">
            <Icon className="size-3.5" strokeWidth={3} />
          </span>
        ))}
      </span>
    </div>
  )
}
