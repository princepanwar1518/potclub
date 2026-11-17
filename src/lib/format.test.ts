import { describe, expect, it } from 'vitest'
import { formatCountdown, formatDateTime, formatCoins, formatSignedCoins } from './format'

describe('formatCoins', () => {
  it.each([
    [0, '0 coins'],
    [1, '1 coin'],
    [440, '440 coins'],
    [9900, '9,900 coins'],
    [100000, '1,00,000 coins'],
    [176000, '1,76,000 coins'],
    [1628000, '16,28,000 coins'],
  ])('%d → %s', (input, expected) => {
    expect(formatCoins(input)).toBe(expected)
  })

  it('rounds fractional coins and never shows a currency symbol', () => {
    expect(formatCoins(439.6)).toBe('440 coins')
    expect(formatCoins(176000)).not.toMatch(/[₹$]/)
  })
})

describe('formatSignedCoins', () => {
  it('prefixes credits and debits', () => {
    expect(formatSignedCoins(55000)).toBe('+55,000 coins')
    expect(formatSignedCoins(-50000)).toBe('−50,000 coins')
    expect(formatSignedCoins(0)).toBe('0 coins')
  })
})

describe('formatDateTime', () => {
  it('renders in IST regardless of the machine time zone', () => {
    // 2026-11-13T18:09:24Z is 11:39 pm IST
    expect(formatDateTime('2026-11-13T18:09:24Z')).toMatch(/13 Nov 2026, 11:39\s?pm/i)
  })
})

describe('formatCountdown', () => {
  it('formats and clamps', () => {
    expect(formatCountdown(120)).toBe('2:00')
    expect(formatCountdown(29.2)).toBe('0:30')
    expect(formatCountdown(-4)).toBe('0:00')
  })
})
