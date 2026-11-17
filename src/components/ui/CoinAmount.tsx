import { formatNumber } from '../../lib/format'
import { cn } from '../../lib/cn'

/**
 * Prominent coin figure: "1,76,000" with a small "coins" unit. Screen readers hear "1,76,000 coins".
 * Coins are play money with no cash value.
 */
export function CoinAmount({ value, className, unitClassName }: { value: number; className?: string; unitClassName?: string }) {
  const n = Math.round(value)
  return (
    <span className={className}>
      <span className="whitespace-nowrap">{formatNumber(n)}</span>{' '}
      <span className={cn('align-baseline text-[0.55em] font-medium opacity-80', unitClassName)}>{Math.abs(n) === 1 ? 'coin' : 'coins'}</span>
    </span>
  )
}
