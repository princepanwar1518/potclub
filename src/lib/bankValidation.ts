/** Indian bank / UPI format checks for the connect-wallet prototype. Formats only — no lookups. */

/** IFSC: 4 letters (bank), a zero, 6 alphanumerics (branch). e.g. HDFC0001234 */
export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/

/** Account numbers in India are 9–18 digits. */
export const ACCOUNT_PATTERN = /^\d{9,18}$/

/** UPI ID (VPA): handle@provider */
export const UPI_PATTERN = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/

export function normalizeIfsc(raw: string): string {
  return raw.replace(/\s/g, '').toUpperCase()
}

export function normalizeAccount(raw: string): string {
  return raw.replace(/[\s-]/g, '')
}

/** "XXXXXX1234" — never render the full number back. */
export function maskAccount(account: string): string {
  const digits = normalizeAccount(account)
  if (digits.length <= 4) return digits
  return `${'X'.repeat(Math.min(8, digits.length - 4))}${digits.slice(-4)}`
}

export interface BankDetails {
  holder: string
  account: string
  confirmAccount: string
  ifsc: string
}

export type BankErrors = Partial<Record<keyof BankDetails, string>>

export function validateBank(d: BankDetails): BankErrors {
  const e: BankErrors = {}
  const holder = d.holder.trim()
  if (holder.length < 3) e.holder = 'Enter the name exactly as it appears on the bank account.'
  else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(holder)) e.holder = 'Use letters, spaces, dots, apostrophes or hyphens only.'
  const account = normalizeAccount(d.account)
  if (!ACCOUNT_PATTERN.test(account)) e.account = 'Account numbers are 9 to 18 digits.'
  if (normalizeAccount(d.confirmAccount) !== account || d.confirmAccount.trim() === '') e.confirmAccount = 'The account numbers do not match.'
  if (!IFSC_PATTERN.test(normalizeIfsc(d.ifsc))) e.ifsc = 'IFSC codes look like HDFC0001234 (11 characters, 5th is zero).'
  return e
}

export function validateUpi(id: string): string | null {
  return UPI_PATTERN.test(id.trim()) ? null : 'UPI IDs look like name@bank.'
}
