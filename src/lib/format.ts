/**
 * Single source of truth for number/date formatting (fixes reference defect 8:
 * "₹100,000" vs "₹1,00,000"). Everything uses the en-IN locale and Asia/Kolkata time.
 */
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

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

/** ₹1,76,000 — whole rupees, Indian digit grouping. */
export function formatINR(amount: number): string {
  return inrFormatter.format(Math.round(amount))
}

/** +₹55,000 / −₹50,000 for ledger rows (uses a true minus sign). */
export function formatSignedINR(amount: number): string {
  if (amount === 0) return formatINR(0)
  return `${amount > 0 ? '+' : '−'}${formatINR(Math.abs(amount))}`
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
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
