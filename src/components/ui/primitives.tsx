import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** Centered page width used by every section (reference content width ≈ 970px; max-w-5xl minus padding = 960px). */
export function Container({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8', className)} {...rest} />
}

export function Card({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('rounded-card border-[3px] border-ink bg-surface shadow-card', className)}
      {...rest}
    />
  )
}

export type Tone = 'lilac' | 'pink' | 'amber' | 'mint' | 'sky'

const toneClasses: Record<Tone, string> = {
  lilac: 'bg-lilac-50 text-lilac-600',
  pink: 'bg-pink-50 text-pink-600',
  amber: 'bg-amber-50 text-amber-600',
  mint: 'bg-mint-50 text-mint-600',
  sky: 'bg-sky-50 text-sky-600',
}

export function IconChip({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-btn border-2 border-ink', toneClasses[tone], className)}
    >
      {children}
    </span>
  )
}

export function Badge({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-btn border-2 border-ink px-2 py-0.5 font-display text-xs font-bold',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'inline-block rounded-btn border-2 border-ink bg-surface-2 px-2 py-0.5 font-display text-sm font-bold text-ink shadow-[3px_3px_0_#141414]',
        className,
      )}
    >
      {children}
    </p>
  )
}

/** Visually hidden but available to screen readers. */
export function SrOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>
}
