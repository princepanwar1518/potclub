import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** Centered page width used by every section (reference content width ≈ 970px at 1512 viewport, 1200 max). */
export function Container({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8', className)} {...rest} />
}

export function Card({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('rounded-card border border-line-soft bg-white/90 shadow-card backdrop-blur-sm', className)}
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
      className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-xl', toneClasses[tone], className)}
    >
      {children}
    </span>
  )
}

export function Badge({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
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
    <p className={cn('text-xs font-semibold tracking-[0.18em] text-indigo uppercase', className)}>{children}</p>
  )
}

/** Visually hidden but available to screen readers. */
export function SrOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>
}
