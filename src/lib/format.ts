/**
 * Single source of truth for number/date formatting. Amounts are PLAY COINS with no cash value
 * (never currency); Indian digit grouping (1,76,000) and Asia/Kolkata time throughout.
 */
const numberFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
})

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

/** "1,76,000 coins" / "1 coin" — whole coins, Indian digit grouping. */
export function formatCoins(amount: number): string {
  const n = Math.round(amount)
  return `${numberFormatter.format(n)} ${Math.abs(n) === 1 ? 'coin' : 'coins'}`
}

/** "+55,000 coins" / "−50,000 coins" for ledger rows (uses a true minus sign). */
export function formatSignedCoins(amount: number): string {
  if (amount === 0) return formatCoins(0)
  return `${amount > 0 ? '+' : '−'}${formatCoins(Math.abs(amount))}`
}

/** 13 Nov 2026, 11:39 pm (IST) */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso))
}

export function formatPercent(value: number): string {
  return `${numberFormatter.format(value)}%`
}

/** "1:05" from 65 seconds; clamps negatives to 0:00. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
