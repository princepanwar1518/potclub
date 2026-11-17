import { describe, expect, it } from 'vitest'
import { formatCountdown, formatDateTime, formatINR, formatSignedINR } from './format'

describe('formatINR', () => {
  it.each([
    [0, '₹0'],
    [440, '₹440'],
    [9900, '₹9,900'],
    [100000, '₹1,00,000'],
    [176000, '₹1,76,000'],
    [1628000, '₹16,28,000'],
  ])('%d → %s', (input, expected) => {
    expect(formatINR(input)).toBe(expected)
  })

  it('rounds fractional rupees', () => {
    expect(formatINR(439.6)).toBe('₹440')
  })
})

describe('formatSignedINR', () => {
  it('prefixes credits and debits', () => {
    expect(formatSignedINR(55000)).toBe('+₹55,000')
    expect(formatSignedINR(-50000)).toBe('−₹50,000')
    expect(formatSignedINR(0)).toBe('₹0')
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
