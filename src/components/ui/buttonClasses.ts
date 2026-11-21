import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'white' | 'mint' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

// Retro desktop: pixel-font labels, 2px black outline, hard offset shadow that "presses" on click.
const base =
  'press inline-flex items-center justify-center gap-2 rounded-btn border-2 border-ink font-display font-bold whitespace-nowrap text-ink shadow-btn ' +
  'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink ' +
  'disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none aria-disabled:cursor-not-allowed aria-disabled:opacity-55'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent', // magenta fill
  secondary: 'bg-surface', // lavender, like "Retry" / "Cancel"
  white: 'bg-surface-2', // white button on the orange call-to-action window
  mint: 'bg-info', // teal
  ghost: 'border-transparent bg-transparent shadow-none hover:border-ink hover:bg-surface',
  danger: 'bg-pink-50 text-danger',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-12 px-8 text-base',
}

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra?: string): string {
  return cn(base, variants[variant], sizes[size], extra)
}
