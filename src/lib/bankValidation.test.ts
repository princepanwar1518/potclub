import { describe, expect, it } from 'vitest'
import { maskAccount, normalizeIfsc, validateBank, validateUpi } from './bankValidation'

const good = { holder: 'Prince Panwar', account: '123456789012', confirmAccount: '123456789012', ifsc: 'HDFC0001234' }

describe('bank details validation', () => {
  it('accepts valid details', () => {
    expect(validateBank(good)).toEqual({})
    expect(validateBank({ ...good, ifsc: 'sbin0a12b34', account: '1234 5678 9012', confirmAccount: '123456789012' })).toEqual({})
  })

  it.each([
    ['short holder', { holder: 'Al' }, 'holder'],
    ['digits in holder', { holder: 'Pr1nce' }, 'holder'],
    ['8-digit account', { account: '12345678', confirmAccount: '12345678' }, 'account'],
    ['19-digit account', { account: '1234567890123456789', confirmAccount: '1234567890123456789' }, 'account'],
    ['letters in account', { account: '12345678901A', confirmAccount: '12345678901A' }, 'account'],
    ['mismatched confirmation', { confirmAccount: '123456789013' }, 'confirmAccount'],
    ['IFSC without 0 in 5th place', { ifsc: 'HDFC1001234' }, 'ifsc'],
    ['short IFSC', { ifsc: 'HDFC000123' }, 'ifsc'],
  ])('rejects %s', (_l, patch, field) => {
    expect(validateBank({ ...good, ...patch })).toHaveProperty(field)
  })

  it('validates UPI IDs', () => {
    expect(validateUpi('prince.p@okhdfcbank')).toBeNull()
    expect(validateUpi('9876543210@ybl')).toBeNull()
    expect(validateUpi('prince@')).not.toBeNull()
    expect(validateUpi('no-at-sign')).not.toBeNull()
  })

  it('masks account numbers and normalizes IFSC', () => {
    expect(maskAccount('123456789012')).toBe('XXXXXXXX9012')
    expect(maskAccount('123456789')).toBe('XXXXX6789')
    expect(normalizeIfsc(' hdfc 0001234 ')).toBe('HDFC0001234')
  })
})
