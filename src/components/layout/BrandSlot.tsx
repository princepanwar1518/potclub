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
      className={cn('inline-flex h-9 min-w-9 items-center gap-2 rounded-xl', className)}
    >
      {brand.logoSrc ? <img src={brand.logoSrc} alt="" width={36} height={36} className="size-9 rounded-xl" /> : null}
      {brand.name ? <span className="font-display text-lg font-semibold text-heading">{brand.name}</span> : null}
    </Link>
  )
}
