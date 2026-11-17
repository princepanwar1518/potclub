import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'white' | 'mint' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-btn font-medium whitespace-nowrap transition duration-200 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-gradient text-white shadow-btn hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgb(109_90_230/0.32)]',
  secondary: 'border border-line-soft bg-white/75 text-violet backdrop-blur hover:bg-white hover:border-indigo/30',
  white: 'bg-white text-violet shadow-card hover:-translate-y-0.5',
  mint: 'bg-[linear-gradient(105deg,#7ee0c3,#7cd4ea)] text-[#14453a] hover:-translate-y-0.5 hover:brightness-105',
  ghost: 'text-violet hover:bg-lilac-50',
  danger: 'border border-danger/25 bg-white text-danger hover:bg-pink-50',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-4 text-[15px] sm:text-base',
  lg: 'h-12 px-6 text-base',
}

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra?: string): string {
  return cn(base, variants[variant], sizes[size], extra)
}
