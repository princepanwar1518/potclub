import { describe, expect, it } from 'vitest'
import { createSeedState } from '../domain/seed'
import { parsePersistedState } from './validate'

const seedJson = () => JSON.parse(JSON.stringify(createSeedState())) as Record<string, unknown>

describe('parsePersistedState (audit A-2: tampered storage must not brick the app)', () => {
  it('accepts a valid seed round-trip and always resets role to guest', () => {
    const s = seedJson()
    s['role'] = 'admin'
    const parsed = parsePersistedState(JSON.stringify(s))
    expect(parsed).not.toBeNull()
    expect(parsed?.role).toBe('guest')
    expect(parsed?.groups).toHaveLength(9)
  })

  it.each([
    ['null input', null],
    ['invalid JSON', '{not json'],
    ['array root', '[]'],
    ['old version', JSON.stringify({ ...seedJson(), version: 1 })],
    ['the exact payload that crashed the app', JSON.stringify({ version: 2, groups: [{}], ledger: [] })],
  ])('rejects %s', (_label, raw) => {
    expect(parsePersistedState(raw)).toBeNull()
  })

  it('rejects malformed groups, ledger rows and limits', () => {
    // Deliberately loose type: these tests write invalid values into the persisted JSON.
    type Loose = { [k: string]: any } & { groups: any[]; ledger: any[]; safety: any; config: any; currentPlayerId: string }
    const mutate = (fn: (s: Loose) => void) => {
      const s = seedJson() as unknown as Loose
      fn(s)
      return parsePersistedState(JSON.stringify(s))
    }
    expect(mutate((s) => (s.groups[0].size = 7))).toBeNull()
    expect(mutate((s) => (s.groups[5].playerIds = [...s.groups[5].playerIds, ...s.groups[5].playerIds]))).toBeNull() // duplicates / over capacity
    expect(mutate((s) => (s.groups[0].picks = { a: 1, b: 1 }))).toBeNull() // duplicate cards
    expect(mutate((s) => (s.ledger[0].amount = '5000'))).toBeNull()
    expect(mutate((s) => (s.ledger[0].amount = 0.5))).toBeNull()
    expect(mutate((s) => (s.ledger[0].createdAt = 'yesterday'))).toBeNull()
    expect(mutate((s) => (s.safety.limits.dailySpend = -1))).toBeNull()
    expect(mutate((s) => (s.safety.pendingLimits = { changes: { evil: 1 }, effectiveAt: '2026-11-18T00:00:00Z' }))).toBeNull()
    expect(mutate((s) => (s.currentPlayerId = 'p-missing'))).toBeNull()
    expect(mutate((s) => (s.config.maintenance = 'no'))).toBeNull()
  })
})
