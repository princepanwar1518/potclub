import { formatINR } from '../lib/format'
import { GRACE_SECONDS, groupPrize, PICK_SECONDS } from '../domain/rules'
import type {
  AppNotification,
  DemoState,
  Group,
  GroupSize,
  LedgerEntry,
  PlatformConfig,
  PlayerId,
  PlayLimits,
} from '../domain/types'

export type DemoAction =
  | { type: 'replace'; state: DemoState }
  | { type: 'join'; groupId: string; at: string; ledgerId: string }
  | { type: 'createGroup'; group: Group }
  | { type: 'addBot'; groupId: string; at: string }
  | { type: 'pick'; groupId: string; playerId: PlayerId; card: number }
  | { type: 'startGrace'; groupId: string; at: string; autoPicks: Record<PlayerId, number> }
  | { type: 'settle'; groupId: string; at: string; winningCard: number; notificationId: string; ledgerId: string }
  | { type: 'ledger'; entry: LedgerEntry }
  | { type: 'saveLimits'; limits: PlayLimits }
  | { type: 'timeout'; until: string }
  | { type: 'selfExclude'; until: string }
  | { type: 'applyReferral'; code: string }
  | { type: 'notificationsRead' }
  | { type: 'setBrowserAlerts'; enabled: boolean }
  | { type: 'toggleMute' }
  | { type: 'updateConfig'; patch: Partial<PlatformConfig> }
  | { type: 'setRole'; role: DemoState['role'] }

function addSeconds(iso: string, seconds: number): string {
  return new Date(Date.parse(iso) + seconds * 1000).toISOString()
}

function updateGroup(state: DemoState, groupId: string, fn: (g: Group) => Group): DemoState {
  return { ...state, groups: state.groups.map((g) => (g.id === groupId ? fn(g) : g)) }
}

/** When the last seat fills, the group moves to card picking (reference: 2 minutes). */
function withSeat(g: Group, playerId: PlayerId, at: string): Group {
  const playerIds = [...g.playerIds, playerId]
  const full = playerIds.length >= g.size
  return {
    ...g,
    playerIds,
    status: full ? 'picking' : 'open',
    phaseEndsAt: full ? addSeconds(at, PICK_SECONDS) : null,
  }
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'replace':
      return action.state

    case 'join': {
      const group = state.groups.find((g) => g.id === action.groupId)
      if (!group) return state
      const entry: LedgerEntry = {
        id: action.ledgerId,
        playerId: state.currentPlayerId,
        type: 'entry',
        amount: -group.entryFee,
        description: `Entry fee · ${group.size}-player group #${group.number}`,
        createdAt: action.at,
        groupId: group.id,
      }
      const next = updateGroup(state, group.id, (g) => withSeat(g, state.currentPlayerId, action.at))
      return { ...next, ledger: [...next.ledger, entry] }
    }

    case 'createGroup':
      return { ...state, groups: [...state.groups, action.group], nextGroupNumber: state.nextGroupNumber + 1 }

    case 'addBot': {
      const id = `p-${state.nextPlayerNumber}`
      const next = updateGroup(state, action.groupId, (g) => (g.status === 'open' ? withSeat(g, id, action.at) : g))
      return {
        ...next,
        players: { ...next.players, [id]: { id, label: `Player #${state.nextPlayerNumber}`, isBot: true } },
        nextPlayerNumber: state.nextPlayerNumber + 1,
      }
    }

    case 'pick':
      return updateGroup(state, action.groupId, (g) => {
        if (g.status !== 'picking' && g.status !== 'grace') return g
        const takenByOther = Object.entries(g.picks).some(([pid, c]) => c === action.card && pid !== action.playerId)
        if (takenByOther || action.card < 1 || action.card > g.size) return g
        return { ...g, picks: { ...g.picks, [action.playerId]: action.card } }
      })

    case 'startGrace':
      return updateGroup(state, action.groupId, (g) =>
        g.status === 'picking'
          ? { ...g, status: 'grace', picks: { ...g.picks, ...action.autoPicks }, phaseEndsAt: addSeconds(action.at, GRACE_SECONDS) }
          : g,
      )

    case 'settle': {
      const group = state.groups.find((g) => g.id === action.groupId)
      if (!group || group.status === 'settled') return state
      const winnerId = Object.entries(group.picks).find(([, c]) => c === action.winningCard)?.[0] ?? null
      const prize = groupPrize(group)
      const me = state.currentPlayerId
      const iPlayed = group.playerIds.includes(me)
      const settled: Group = {
        ...group,
        status: 'settled',
        winnerId,
        winningCard: action.winningCard,
        settledAt: action.at,
        phaseEndsAt: null,
      }
      let next: DemoState = updateGroup(state, group.id, () => settled)
      if (winnerId === me) {
        next = {
          ...next,
          ledger: [
            ...next.ledger,
            {
              id: action.ledgerId,
              playerId: me,
              type: 'prize',
              amount: prize,
              description: `Prize · ${group.size}-player group #${group.number}`,
              createdAt: action.at,
              groupId: group.id,
            },
          ],
        }
      }
      if (iPlayed) {
        const winnerLabel = winnerId ? (state.players[winnerId]?.label ?? 'Another player') : 'Another player'
        const note: AppNotification =
          winnerId === me
            ? {
                id: action.notificationId,
                kind: 'win',
                title: `You won draw #${group.number}!`,
                body: `Card ${action.winningCard} came up — ${formatINR(prize)} (demo credits) added to your balance.`,
                createdAt: action.at,
                read: false,
              }
            : {
                id: action.notificationId,
                kind: 'loss',
                title: `Draw #${group.number} settled`,
                body: `${winnerLabel} won with card ${action.winningCard}. Better luck next time!`,
                createdAt: action.at,
                read: false,
              }
        next = { ...next, notifications: [note, ...next.notifications] }
      }
      return next
    }

    case 'ledger':
      return { ...state, ledger: [...state.ledger, action.entry] }

    case 'saveLimits':
      return { ...state, safety: { ...state.safety, limits: action.limits } }

    case 'timeout':
      return { ...state, safety: { ...state.safety, timeoutUntil: action.until } }

    case 'selfExclude':
      return { ...state, safety: { ...state.safety, selfExcludedUntil: action.until } }

    case 'applyReferral':
      return { ...state, referral: { ...state.referral, appliedCode: action.code } }

    case 'notificationsRead':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) }

    case 'setBrowserAlerts':
      return { ...state, browserAlerts: action.enabled }

    case 'toggleMute':
      return { ...state, soundMuted: !state.soundMuted }

    case 'updateConfig':
      return { ...state, config: { ...state.config, ...action.patch } }

    case 'setRole':
      return { ...state, role: action.role }
  }
}

export function newGroup(args: {
  id: string
  number: number
  size: GroupSize
  entryFee: number
  feePct: number
  at: string
}): Group {
  return {
    id: args.id,
    number: args.number,
    size: args.size,
    entryFee: args.entryFee,
    feePct: args.feePct,
    playerIds: [],
    picks: {},
    status: 'open',
    createdAt: args.at,
    phaseEndsAt: null,
    winnerId: null,
    winningCard: null,
    settledAt: null,
  }
}
