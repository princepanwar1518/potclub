import { describe, expect, it } from 'vitest'
import {
  adminSummary,
  availableCards,
  balanceOf,
  canJoin,
  drawHistory,
  groupPrize,
  leaderboard,
  openGroups,
  playerStats,
  prizeBreakdown,
} from './rules'
import { createSeedState, GUEST_ID } from './seed'
import type { DemoState } from './types'

const NOW = Date.parse('2026-11-17T08:00:00Z')

function withBalance(state: DemoState, amount: number): DemoState {
  return {
    ...state,
    ledger: [
      ...state.ledger,
      { id: 'x', playerId: GUEST_ID, type: 'deposit', amount, description: 'test', createdAt: '2026-11-17T07:00:00Z' },
    ],
  }
}

describe('prize maths (defect 2)', () => {
  it('deducts the 12% platform fee from the gross pool', () => {
    expect(prizeBreakdown(20000, 10, 12)).toEqual({ grossPool: 200000, platformFee: 24000, prize: 176000 })
    expect(prizeBreakdown(100, 5, 12)).toEqual({ grossPool: 500, platformFee: 60, prize: 440 })
  })

  it('open seed pools sum to ₹16,28,000, not the reference ₹18,50,000', () => {
    const total = openGroups(createSeedState().groups).reduce((s, g) => s + groupPrize(g), 0)
    expect(total).toBe(1628000)
  })
})

describe('player stats (defect 3)', () => {
  it('derives balance and games from the ledger', () => {
    const s = createSeedState()
    expect(balanceOf(s.ledger, GUEST_ID)).toBe(9900)
    expect(playerStats(s, GUEST_ID)).toMatchObject({
      balance: 9900,
      games: 3,
      wins: 0,
      winnings: 0,
      totalDeposited: 80000,
      totalEntries: 70100,
    })
  })
})

describe('join eligibility (defect 4)', () => {
  it('blocks joins the guest cannot afford', () => {
    const s = createSeedState()
    const r = canJoin(s, 'g-1002', NOW)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/insufficient balance — add ₹10,100/i)
  })

  it('blocks a second entry into the same group', () => {
    const r = canJoin(withBalance(createSeedState(), 100000), 'g-1001', NOW)
    expect(r).toEqual({ ok: false, reason: 'You are already in this group.' })
  })

  it('allows an affordable open group', () => {
    expect(canJoin(withBalance(createSeedState(), 100000), 'g-1002', NOW).ok).toBe(true)
  })

  it('blocks settled groups, maintenance, time-outs, self-exclusion and limits', () => {
    const rich = withBalance(createSeedState(), 100000)
    expect(canJoin(rich, 'g-152', NOW).ok).toBe(false)
    expect(canJoin({ ...rich, config: { ...rich.config, maintenance: true } }, 'g-1002', NOW).ok).toBe(false)
    expect(canJoin({ ...rich, safety: { ...rich.safety, timeoutUntil: '2026-11-18T00:00:00Z' } }, 'g-1002', NOW).ok).toBe(false)
    expect(canJoin({ ...rich, safety: { ...rich.safety, selfExcludedUntil: '2027-01-01T00:00:00Z' } }, 'g-1002', NOW).ok).toBe(false)
    const limited = { ...rich, safety: { ...rich.safety, limits: { hourlySpend: null, dailySpend: 15000, dailyLoss: null } } }
    const r = canJoin(limited, 'g-1002', NOW)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/daily spend limit/)
  })

  it('ignores an expired time-out', () => {
    const rich = withBalance(createSeedState(), 100000)
    expect(canJoin({ ...rich, safety: { ...rich.safety, timeoutUntil: '2026-11-01T00:00:00Z' } }, 'g-1002', NOW).ok).toBe(true)
  })
})

describe('draw history (defect 5)', () => {
  it('is sorted newest first', () => {
    const numbers = drawHistory(createSeedState().groups).map((g) => g.number)
    expect(numbers).toEqual([152, 151, 150, 27, 12])
  })
})

describe('leaderboard (defect 6)', () => {
  it('ranks real winners with wins and prize totals', () => {
    const rows = leaderboard(createSeedState())
    expect(rows.map((r) => [r.player.label, r.wins, r.winnings])).toEqual([
      ['Player #31', 2, 88000],
      ['Player #540002', 2, 880],
      ['Player #540004', 1, 440],
    ])
  })
})

describe('admin summary', () => {
  it('matches the reference revenue of ₹12,180 from settled draws', () => {
    expect(adminSummary(createSeedState())).toMatchObject({ totalRevenue: 12180, totalDraws: 5, activeGroups: 4 })
  })
})

describe('cards', () => {
  it('offers only unique, untaken cards', () => {
    const g = { ...createSeedState().groups[5]!, picks: { a: 1, b: 2 } }
    expect(availableCards(g, 'c')).toEqual([3, 4, 5, 6, 7, 8, 9, 10])
    expect(availableCards(g, 'a')).toContain(1)
  })
})

describe('responsible-play safeguards (audit findings A-4, A-5)', () => {
  const NOW_MS = Date.parse('2026-11-17T08:00:00Z')

  it('applies tighter limits immediately and queues looser ones for 24 hours', async () => {
    const { planLimitChange, effectiveLimits } = await import('./rules')
    const current = { hourlySpend: 1000, dailySpend: 5000, dailyLoss: null }
    const plan = planLimitChange(current, { hourlySpend: 500, dailySpend: 20000, dailyLoss: 3000 }, NOW_MS)
    expect(plan.limits).toEqual({ hourlySpend: 500, dailySpend: 5000, dailyLoss: 3000 })
    expect(plan.pending).toEqual({ changes: { dailySpend: 20000 }, effectiveAt: '2026-11-18T08:00:00.000Z' })
    const safety = { limits: plan.limits, pendingLimits: plan.pending }
    expect(effectiveLimits(safety, NOW_MS + 23 * 3_600_000).dailySpend).toBe(5000)
    expect(effectiveLimits(safety, NOW_MS + 24 * 3_600_000).dailySpend).toBe(20000)
  })

  it('treats removing a limit as loosening', async () => {
    const { planLimitChange } = await import('./rules')
    const plan = planLimitChange({ hourlySpend: null, dailySpend: 5000, dailyLoss: null }, { hourlySpend: null, dailySpend: null, dailyLoss: null }, NOW_MS)
    expect(plan.limits.dailySpend).toBe(5000)
    expect(plan.pending?.changes).toEqual({ dailySpend: null })
  })

  it('keeps enforcing the old limit during cooling-off', () => {
    const s = withBalance(createSeedState(), 100000)
    const state = {
      ...s,
      safety: {
        ...s.safety,
        limits: { hourlySpend: null, dailySpend: 15000, dailyLoss: null },
        pendingLimits: { changes: { dailySpend: null }, effectiveAt: '2026-11-18T08:00:00Z' },
      },
    }
    expect(canJoin(state, 'g-1002', NOW).ok).toBe(false)
    expect(canJoin(state, 'g-1002', Date.parse('2026-11-18T08:00:01Z')).ok).toBe(true)
  })
})
