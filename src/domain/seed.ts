import type { DemoState, Group, GroupSize, LedgerEntry, Player, PlayerId } from './types'

export const STATE_VERSION = 1
export const GUEST_ID: PlayerId = 'p-600001'

/**
 * Deterministic demo data reconstructed from the reference so every screen agrees:
 *  - Guest ledger: deposits 5,000 + 20,000 + 55,000 = 80,000; entries 20,000 + 100 + 50,000 = 70,100;
 *    balance 9,900; games 3; wins 0 (reference showed games = 1 — defect 3).
 *  - 5 settled 5-player draws at a 12% fee: 2 × ₹10,000 entry (prize ₹44,000, fee ₹6,000) and
 *    3 × ₹100 entry (prize ₹440, fee ₹60) → platform revenue ₹12,180, matching the reference admin.
 *  - 4 open groups, prize pools ₹1,76,000 + ₹1,76,000 + ₹3,96,000 + ₹8,80,000 = ₹16,28,000
 *    (reference displayed ₹18,50,000 by ignoring the fee — defect 2).
 */

function player(id: PlayerId, isBot = true): Player {
  return { id, label: `Player #${id.slice(2)}`, isBot }
}

/** Fill a roster up to `count` with deterministic bot ids. */
function roster(fixed: PlayerId[], count: number, botStart: number): PlayerId[] {
  const ids = [...fixed]
  let n = botStart
  while (ids.length < count) ids.push(`p-${n++}`)
  return ids
}

function settledGroup(args: {
  id: string
  number: number
  entryFee: number
  createdAt: string
  settledAt: string
  playerIds: PlayerId[]
  winnerId: PlayerId
}): Group {
  const size: GroupSize = 5
  const picks: Record<PlayerId, number> = {}
  args.playerIds.forEach((pid, i) => {
    picks[pid] = ((i * 2) % size) + 1 // unique cards 1,3,5,2,4
  })
  return {
    id: args.id,
    number: args.number,
    size,
    entryFee: args.entryFee,
    feePct: 12,
    playerIds: args.playerIds,
    picks,
    status: 'settled',
    createdAt: args.createdAt,
    phaseEndsAt: null,
    winnerId: args.winnerId,
    winningCard: picks[args.winnerId] ?? null,
    settledAt: args.settledAt,
  }
}

function openGroup(args: {
  id: string
  number: number
  size: GroupSize
  entryFee: number
  createdAt: string
  playerIds: PlayerId[]
}): Group {
  return {
    ...args,
    feePct: 12,
    picks: {},
    status: 'open',
    phaseEndsAt: null,
    winnerId: null,
    winningCard: null,
    settledAt: null,
  }
}

export function createSeedState(): DemoState {
  const groups: Group[] = [
    settledGroup({
      id: 'g-12',
      number: 12,
      entryFee: 10000,
      createdAt: '2026-05-16T16:50:00Z',
      settledAt: '2026-05-16T17:44:06Z',
      playerIds: roster(['p-31'], 5, 610001),
      winnerId: 'p-31',
    }),
    settledGroup({
      id: 'g-27',
      number: 27,
      entryFee: 10000,
      createdAt: '2026-08-15T15:40:00Z',
      settledAt: '2026-08-15T16:36:08Z',
      playerIds: roster(['p-31'], 5, 610005),
      winnerId: 'p-31',
    }),
    settledGroup({
      id: 'g-150',
      number: 150,
      entryFee: 100,
      createdAt: '2026-10-30T15:30:00Z',
      settledAt: '2026-10-30T16:23:29Z',
      playerIds: roster(['p-540004', 'p-540002'], 5, 610009),
      winnerId: 'p-540004',
    }),
    settledGroup({
      id: 'g-151',
      number: 151,
      entryFee: 100,
      createdAt: '2026-11-03T16:00:00Z',
      settledAt: '2026-11-13T18:14:00Z',
      playerIds: roster([GUEST_ID, 'p-540002'], 5, 610012),
      winnerId: 'p-540002',
    }),
    settledGroup({
      id: 'g-152',
      number: 152,
      entryFee: 100,
      createdAt: '2026-11-16T16:40:00Z',
      settledAt: '2026-11-16T17:15:54Z',
      playerIds: roster(['p-540002', 'p-540004'], 5, 610015),
      winnerId: 'p-540002',
    }),
    openGroup({
      id: 'g-1001',
      number: 1001,
      size: 10,
      entryFee: 20000,
      createdAt: '2026-11-03T15:58:00Z',
      playerIds: roster([GUEST_ID], 8, 620001),
    }),
    openGroup({
      id: 'g-1002',
      number: 1002,
      size: 10,
      entryFee: 20000,
      createdAt: '2026-11-14T10:12:00Z',
      playerIds: roster([], 3, 620008),
    }),
    openGroup({
      id: 'g-1003',
      number: 1003,
      size: 15,
      entryFee: 30000,
      createdAt: '2026-11-15T09:30:00Z',
      playerIds: roster([], 2, 620011),
    }),
    openGroup({
      id: 'g-1004',
      number: 1004,
      size: 20,
      entryFee: 50000,
      createdAt: '2026-11-13T17:55:00Z',
      playerIds: roster([GUEST_ID], 3, 620013),
    }),
  ]

  const players: Record<PlayerId, Player> = {}
  for (const g of groups) {
    for (const id of g.playerIds) players[id] = player(id, id !== GUEST_ID && !['p-31', 'p-540002', 'p-540004'].includes(id))
  }
  players[GUEST_ID] = player(GUEST_ID, false)

  const ledger: LedgerEntry[] = [
    { id: 'l-1', playerId: GUEST_ID, type: 'deposit', amount: 5000, description: 'Demo deposit', createdAt: '2026-11-03T16:04:33Z' },
    { id: 'l-2', playerId: GUEST_ID, type: 'deposit', amount: 20000, description: 'Demo deposit', createdAt: '2026-11-03T16:04:52Z' },
    { id: 'l-3', playerId: GUEST_ID, type: 'entry', amount: -20000, description: 'Entry fee · 10-player group #1001', createdAt: '2026-11-03T16:04:58Z', groupId: 'g-1001' },
    { id: 'l-4', playerId: GUEST_ID, type: 'entry', amount: -100, description: 'Entry fee · 5-player group #151', createdAt: '2026-11-03T16:05:08Z', groupId: 'g-151' },
    { id: 'l-5', playerId: GUEST_ID, type: 'deposit', amount: 55000, description: 'Demo deposit', createdAt: '2026-11-13T18:09:01Z' },
    { id: 'l-6', playerId: GUEST_ID, type: 'entry', amount: -50000, description: 'Entry fee · 20-player group #1004', createdAt: '2026-11-13T18:09:24Z', groupId: 'g-1004' },
  ]

  return {
    version: STATE_VERSION,
    currentPlayerId: GUEST_ID,
    role: 'guest',
    players,
    groups,
    ledger,
    config: { platformFeePct: 12, minDeposit: 200, maxWithdrawal: 100000, maintenance: false },
    safety: { limits: { hourlySpend: null, dailySpend: null, dailyLoss: null }, timeoutUntil: null, selfExcludedUntil: null },
    notifications: [
      {
        id: 'n-1',
        kind: 'loss',
        title: 'Draw #151 settled',
        body: 'Player #540002 won ₹440 with card 3. Better luck next time!',
        createdAt: '2026-11-13T18:14:00Z',
        read: true,
      },
    ],
    referral: { code: 'REF-600001', appliedCode: null, successfulReferrals: 0, bonusesEarned: 0 },
    soundMuted: false,
    browserAlerts: false,
    nextGroupNumber: 1005,
    nextPlayerNumber: 630001,
  }
}
