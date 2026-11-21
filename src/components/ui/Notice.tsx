import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type NoticeTone = 'success' | 'error' | 'info'

const styles: Record<NoticeTone, string> = {
  success: 'bg-[#c9f7d6] text-success',
  error: 'bg-pink-50 text-danger',
  info: 'bg-mint-50 text-mint-600',
}

const icons = { success: CircleCheck, error: CircleAlert, info: Info }

/** Inline status message. Uses role=status/alert so screen readers announce it. */
export function Notice({ tone, children, className }: { tone: NoticeTone; children: ReactNode; className?: string }) {
  const Icon = icons[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2 rounded-btn border-2 border-ink px-3 py-2 text-sm font-bold', styles[tone], className)}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-card border-[3px] border-dashed border-ink bg-surface px-6 py-12 text-center">
      <span aria-hidden="true" className="mb-3 inline-flex size-12 items-center justify-center rounded-btn border-2 border-ink bg-accent text-ink shadow-[3px_3px_0_#141414]">
        {icon}
      </span>
      <h3 className="text-lg">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
