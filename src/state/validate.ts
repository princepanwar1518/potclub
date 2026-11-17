import { STATE_VERSION } from '../domain/seed'
import type { AppNotification, DemoState, Group, LedgerEntry, Player } from '../domain/types'

/*
 * Structural validation for state restored from localStorage. Storage is user-editable, so a
 * corrupt or hand-edited value must never crash the app (audit finding A-2). Anything that does
 * not match the expected shape is discarded and the demo restarts from the seed.
 *
 * This protects the UI from bad data; it does NOT make client data trustworthy. Balances, roles
 * and results must come from the server in production.
 */

type Rec = Record<string, unknown>

const isObj = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v)
const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
const isIso = (v: unknown): v is string => isStr(v) && !Number.isNaN(Date.parse(v))
const isNullable = <T,>(v: unknown, guard: (x: unknown) => x is T): boolean => v === null || guard(v)
const isNonNegInt = (v: unknown): v is number => isInt(v) && v >= 0

const GROUP_STATUS = new Set(['open', 'picking', 'grace', 'settled'])
const LEDGER_TYPES = new Set(['deposit', 'withdrawal', 'entry', 'prize', 'bonus'])
const NOTE_KINDS = new Set(['win', 'loss', 'info'])
const SIZES = new Set([5, 10, 15, 20])

function isPlayer(v: unknown): v is Player {
  return isObj(v) && isStr(v['id']) && isStr(v['label']) && isBool(v['isBot'])
}

function isGroup(v: unknown): v is Group {
  if (!isObj(v)) return false
  const size = v['size']
  const picks = v['picks']
  const playerIds = v['playerIds']
  return (
    isStr(v['id']) &&
    isInt(v['number']) &&
    isInt(size) &&
    SIZES.has(size) &&
    isNonNegInt(v['entryFee']) &&
    typeof v['feePct'] === 'number' &&
    v['feePct'] >= 0 &&
    v['feePct'] <= 100 &&
    Array.isArray(playerIds) &&
    playerIds.length <= size &&
    playerIds.every(isStr) &&
    new Set(playerIds).size === playerIds.length &&
    isObj(picks) &&
    Object.values(picks).every((c) => isInt(c) && c >= 1 && c <= size) &&
    new Set(Object.values(picks)).size === Object.values(picks).length &&
    isStr(v['status']) &&
    GROUP_STATUS.has(v['status']) &&
    isIso(v['createdAt']) &&
    isNullable(v['phaseEndsAt'], isIso) &&
    isNullable(v['winnerId'], isStr) &&
    isNullable(v['winningCard'], isInt) &&
    isNullable(v['settledAt'], isIso)
  )
}

function isLedgerEntry(v: unknown): v is LedgerEntry {
  return (
    isObj(v) &&
    isStr(v['id']) &&
    isStr(v['playerId']) &&
    isStr(v['type']) &&
    LEDGER_TYPES.has(v['type']) &&
    isInt(v['amount']) &&
    isStr(v['description']) &&
    isIso(v['createdAt']) &&
    (v['groupId'] === undefined || isStr(v['groupId']))
  )
}

function isNotification(v: unknown): v is AppNotification {
  return (
    isObj(v) &&
    isStr(v['id']) &&
    isStr(v['kind']) &&
    NOTE_KINDS.has(v['kind']) &&
    isStr(v['title']) &&
    isStr(v['body']) &&
    isIso(v['createdAt']) &&
    isBool(v['read'])
  )
}

const isLimit = (v: unknown) => v === null || (isInt(v) && v > 0)

/** Returns a safe DemoState, or null when the value must be discarded. Role is always reset to guest. */
export function parsePersistedState(raw: string | null): DemoState | null {
  if (!raw) return null
  let v: unknown
  try {
    v = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isObj(v) || v['version'] !== STATE_VERSION) return null

  const players = v['players']
  const config = v['config']
  const safety = v['safety']
  const referral = v['referral']
  const groups = v['groups']
  const ledger = v['ledger']
  const notifications = v['notifications']

  if (!isStr(v['currentPlayerId'])) return null
  if (!isObj(players) || !Object.values(players).every(isPlayer) || !isPlayer(players[v['currentPlayerId']])) return null
  if (!Array.isArray(groups) || !groups.every(isGroup)) return null
  if (new Set(groups.map((g) => g.id)).size !== groups.length) return null
  if (!Array.isArray(ledger) || !ledger.every(isLedgerEntry)) return null
  if (!Array.isArray(notifications) || !notifications.every(isNotification)) return null
  if (
    !isObj(config) ||
    typeof config['platformFeePct'] !== 'number' ||
    !isNonNegInt(config['minDeposit']) ||
    !isNonNegInt(config['maxWithdrawal']) ||
    !isBool(config['maintenance'])
  ) {
    return null
  }
  if (!isObj(safety) || !isObj(safety['limits'])) return null
  const limits = safety['limits']
  if (!isLimit(limits['hourlySpend']) || !isLimit(limits['dailySpend']) || !isLimit(limits['dailyLoss'])) return null
  const pending = safety['pendingLimits']
  if (pending !== null) {
    if (!isObj(pending) || !isIso(pending['effectiveAt']) || !isObj(pending['changes'])) return null
    const changes = pending['changes']
    for (const [k, val] of Object.entries(changes)) {
      if (!(k in limits) || !isLimit(val)) return null
    }
  }
  if (!isNullable(safety['timeoutUntil'], isIso) || !isNullable(safety['selfExcludedUntil'], isIso)) return null
  if (!isObj(referral) || !isStr(referral['code']) || !isNullable(referral['appliedCode'], isStr)) return null
  if (!isNonNegInt(referral['successfulReferrals']) || !isNonNegInt(referral['bonusesEarned'])) return null
  if (!isBool(v['soundMuted']) || !isBool(v['browserAlerts'])) return null
  if (!isInt(v['nextGroupNumber']) || !isInt(v['nextPlayerNumber'])) return null

  const state = v as unknown as DemoState
  // Elevated access is never restored from storage.
  return { ...state, role: 'guest' }
}
