import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type NoticeTone = 'success' | 'error' | 'info'

const styles: Record<NoticeTone, string> = {
  success: 'border-cp-green/40 bg-cp-green/10 text-cp-green',
  error: 'border-cp-red/60 bg-cp-red/10 text-danger',
  info: 'border-cp-cyan/40 bg-cp-cyan/5 text-cp-cyan',
}

const icons = { success: CircleCheck, error: CircleAlert, info: Info }

/** Inline status message. Uses role=status/alert so screen readers announce it. */
export function Notice({ tone, children, className }: { tone: NoticeTone; children: ReactNode; className?: string }) {
  const Icon = icons[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2 rounded-btn border px-3 py-2 text-sm', styles[tone], className)}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
      <span aria-hidden="true" className="mb-3 inline-flex size-12 items-center justify-center rounded-btn border border-cp-green/40 bg-cp-green/10 text-cp-green">
        {icon}
      </span>
      <h3 className="text-lg">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
