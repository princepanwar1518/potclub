import { describe, expect, it } from 'vitest'
import { balanceOf, drawHistory, leaderboard, playerStats } from '../domain/rules'
import { createSeedState, GUEST_ID } from '../domain/seed'
import type { DemoState } from '../domain/types'
import { demoReducer, newGroup } from './reducer'

const AT = '2026-11-17T08:00:00Z'

function fundedState(): DemoState {
  return demoReducer(createSeedState(), {
    type: 'ledger',
    entry: { id: 'dep', playerId: GUEST_ID, type: 'topup', amount: 1000, description: 'test', createdAt: AT },
  })
}

describe('reducer: full group lifecycle', () => {
  it('join debits the fee; filling the last seat starts card picking', () => {
    let s = fundedState()
    s = demoReducer(s, { type: 'createGroup', group: newGroup({ id: 'g-new', number: 1005, size: 5, entryFee: 100, feePct: 12, at: AT }) })
    s = demoReducer(s, { type: 'join', groupId: 'g-new', at: AT, ledgerId: 'j' })
    expect(balanceOf(s.ledger, GUEST_ID)).toBe(9900 + 1000 - 100)
    for (let i = 0; i < 4; i++) s = demoReducer(s, { type: 'addBot', groupId: 'g-new', at: AT })
    const g = s.groups.find((x) => x.id === 'g-new')!
    expect(g.playerIds).toHaveLength(5)
    expect(g.status).toBe('picking')
    expect(g.phaseEndsAt).toBe('2026-11-17T08:02:00.000Z')
    // bots beyond capacity are ignored
    const after = demoReducer(s, { type: 'addBot', groupId: 'g-new', at: AT })
    expect(after.groups.find((x) => x.id === 'g-new')!.playerIds).toHaveLength(5)
  })

  it('rejects a duplicate card and settles a win into balance, stats, history and leaderboard', () => {
    let s = fundedState()
    s = demoReducer(s, { type: 'createGroup', group: newGroup({ id: 'g-new', number: 1005, size: 5, entryFee: 100, feePct: 12, at: AT }) })
    s = demoReducer(s, { type: 'join', groupId: 'g-new', at: AT, ledgerId: 'j' })
    for (let i = 0; i < 4; i++) s = demoReducer(s, { type: 'addBot', groupId: 'g-new', at: AT })
    const bots = s.groups.find((x) => x.id === 'g-new')!.playerIds.filter((p) => p !== GUEST_ID)
    s = demoReducer(s, { type: 'pick', groupId: 'g-new', playerId: GUEST_ID, card: 4 })
    s = demoReducer(s, { type: 'pick', groupId: 'g-new', playerId: bots[0]!, card: 4 }) // taken → ignored
    expect(s.groups.find((x) => x.id === 'g-new')!.picks[bots[0]!]).toBeUndefined()
    s = demoReducer(s, { type: 'startGrace', groupId: 'g-new', at: AT, autoPicks: { [bots[0]!]: 1, [bots[1]!]: 2, [bots[2]!]: 3, [bots[3]!]: 5 } })
    s = demoReducer(s, { type: 'settle', groupId: 'g-new', at: '2026-11-17T09:00:00Z', winningCard: 4, notificationId: 'n', ledgerId: 'p' })

    expect(balanceOf(s.ledger, GUEST_ID)).toBe(9900 + 1000 - 100 + 440)
    expect(playerStats(s, GUEST_ID)).toMatchObject({ games: 4, wins: 1, winnings: 440 })
    expect(drawHistory(s.groups)[0]?.number).toBe(1005)
    expect(leaderboard(s).find((r) => r.player.id === GUEST_ID)).toMatchObject({ wins: 1, winnings: 440 })
    expect(s.notifications[0]).toMatchObject({ kind: 'win', read: false })
    // settling twice is a no-op
    const again = demoReducer(s, { type: 'settle', groupId: 'g-new', at: AT, winningCard: 1, notificationId: 'n2', ledgerId: 'p2' })
    expect(again).toBe(s)
  })
})
