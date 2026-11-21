import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'white' | 'mint' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

// Cyberpunk: uppercase terminal labels, hard edges, neon glow, cyan focus ring (style guide .button).
const base =
  'inline-flex items-center justify-center gap-2 rounded-btn font-bold uppercase tracking-wider whitespace-nowrap transition duration-200 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-cp-cyan ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  // .button — solid neon green, black text, glow
  primary: 'border border-cp-green bg-cp-green text-black shadow-btn hover:shadow-[0_0_32px_rgb(0_255_0/0.75)] hover:brightness-110',
  // .button--ghost — transparent with green outline
  secondary: 'border border-cp-green bg-transparent text-cp-green hover:bg-cp-green/10',
  // ghost in cyan for the call-to-action panel
  white: 'border border-cp-cyan bg-transparent text-cp-cyan shadow-[0_0_18px_rgb(0_255_255/0.35)] hover:bg-cp-cyan/10',
  // solid cyan action
  mint: 'border border-cp-cyan bg-cp-cyan text-black shadow-[0_0_20px_rgb(0_255_255/0.45)] hover:brightness-110',
  ghost: 'text-cp-cyan hover:bg-cp-cyan/10',
  danger: 'border border-cp-red bg-transparent text-danger hover:bg-cp-red/10',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-8 text-sm',
}

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra?: string): string {
  return cn(base, variants[variant], sizes[size], extra)
}
