import { Link } from 'react-router'
import { brand } from '../../config/brand'
import { cn } from '../../lib/cn'

/**
 * Home link that shows the configured logo/name. With no branding configured it reserves the
 * space and stays keyboard/screen-reader accessible ("Home") without inventing an identity.
 */
export function BrandSlot({ className, to = '/' }: { className?: string; to?: string }) {
  const hasBrand = Boolean(brand.name || brand.logoSrc)
  return (
    <Link
      to={to}
      aria-label={brand.name ?? brand.homeLabel}
      data-brand-slot={hasBrand ? 'filled' : 'empty'}
      className={cn('inline-flex h-9 min-w-9 items-center gap-2 rounded-btn', className)}
    >
      {brand.logoSrc ? <img src={brand.logoSrc} alt="" width={36} height={36} className="size-9 rounded-btn border-2 border-ink object-cover shadow-[2px_2px_0_#141414]" /> : null}
      {brand.wordmarkSrc ? (
        // Wordmark SVG (Fredoka Bold paths); height-driven so it scales with the slot.
        <img src={brand.wordmarkSrc} alt="" height={20} className="h-5 w-auto sm:h-6" />
      ) : brand.name ? (
        <span className="rounded-btn border-2 border-ink bg-accent px-2.5 py-0.5 font-display text-lg font-bold text-ink shadow-[3px_3px_0_#141414]">
          {brand.name}
        </span>
      ) : null}
    </Link>
  )
}
