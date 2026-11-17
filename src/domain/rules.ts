import { formatCoins } from '../lib/format'
import type { DemoState, Group, GroupSize, LedgerEntry, PendingLimits, Player, PlayerId, PlayLimits, Result, SafetyState } from './types'

/** Default entry fee per group size (from the reference's open groups and 5-player draws). */
export const DEFAULT_ENTRY_FEE: Record<GroupSize, number> = { 5: 100, 10: 20000, 15: 30000, 20: 50000 }

export const PICK_SECONDS = 120
export const GRACE_SECONDS = 30
/** Largest single free coin top-up. */
export const MAX_TOP_UP = 100000
/** Loosening or removing a limit only takes effect after this cooling-off period. */
export const LIMIT_COOLING_OFF_HOURS = 24

const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS

export interface PrizeBreakdown {
  grossPool: number
  platformFee: number
  prize: number
}

/**
 * Fixes reference defect 2: the payout is the gross pool minus the platform fee.
 * 20,000 coins × 10 = 2,00,000 gross; 12% fee = 24,000; prize = 1,76,000 coins.
 */
export function prizeBreakdown(entryFee: number, size: number, feePct: number): PrizeBreakdown {
  const grossPool = entryFee * size
  const platformFee = Math.round((grossPool * feePct) / 100)
  return { grossPool, platformFee, prize: grossPool - platformFee }
}

export function groupPrize(group: Pick<Group, 'entryFee' | 'size' | 'feePct'>): number {
  return prizeBreakdown(group.entryFee, group.size, group.feePct).prize
}

export function balanceOf(ledger: readonly LedgerEntry[], playerId: PlayerId): number {
  return ledger.reduce((sum, e) => (e.playerId === playerId ? sum + e.amount : sum), 0)
}

export interface PlayerStats {
  balance: number
  games: number
  wins: number
  winnings: number
  totalToppedUp: number
  totalEntries: number
}

/** Fixes defect 3: "games" = number of group entries in the ledger, not a separate counter. */
export function playerStats(state: Pick<DemoState, 'ledger' | 'groups'>, playerId: PlayerId): PlayerStats {
  let balance = 0
  let games = 0
  let winnings = 0
  let totalToppedUp = 0
  let totalEntries = 0
  for (const e of state.ledger) {
    if (e.playerId !== playerId) continue
    balance += e.amount
    if (e.type === 'entry') {
      games += 1
      totalEntries += -e.amount
    } else if (e.type === 'prize') {
      winnings += e.amount
    } else if (e.type === 'topup') {
      totalToppedUp += e.amount
    }
  }
  const wins = state.groups.filter((g) => g.status === 'settled' && g.winnerId === playerId).length
  return { balance, games, wins, winnings, totalToppedUp, totalEntries }
}

export function openGroups(groups: readonly Group[]): Group[] {
  return groups.filter((g) => g.status === 'open')
}

export function settledGroups(groups: readonly Group[]): Group[] {
  return groups.filter((g) => g.status === 'settled')
}

/** Fixes defect 5: newest first, ties broken by group number (desc) for a stable order. */
export function drawHistory(groups: readonly Group[]): Group[] {
  return settledGroups(groups).sort((a, b) => {
    const t = Date.parse(b.settledAt ?? '') - Date.parse(a.settledAt ?? '')
    return t !== 0 ? t : b.number - a.number
  })
}

export interface LeaderboardRow {
  rank: number
  player: Player
  wins: number
  winnings: number
}

/**
 * Fixes defect 6: rankings derived from settled draws (sum of actual prizes paid).
 * Sorted by winnings desc, then wins desc, then label for determinism. Only players with ≥1 win.
 */
export function leaderboard(state: Pick<DemoState, 'groups' | 'players'>, limit = 10): LeaderboardRow[] {
  const totals = new Map<PlayerId, { wins: number; winnings: number }>()
  for (const g of settledGroups(state.groups)) {
    if (!g.winnerId) continue
    const t = totals.get(g.winnerId) ?? { wins: 0, winnings: 0 }
    t.wins += 1
    t.winnings += groupPrize(g)
    totals.set(g.winnerId, t)
  }
  return [...totals.entries()]
    .flatMap(([id, t]) => {
      const player = state.players[id]
      return player ? [{ player, ...t }] : []
    })
    .sort((a, b) => b.winnings - a.winnings || b.wins - a.wins || a.player.label.localeCompare(b.player.label))
    .slice(0, limit)
    .map((row, i) => ({ rank: i + 1, ...row }))
}

const LIMIT_KEYS: readonly (keyof PlayLimits)[] = ['hourlySpend', 'dailySpend', 'dailyLoss']

/** A change is "tighter" when it sets a limit where there was none, or lowers an existing one. */
function isTighterOrSame(current: number | null, next: number | null): boolean {
  if (next === null) return current === null
  return current === null || next <= current
}

/**
 * Splits a requested limit change: tighter values apply now, looser values (raise or remove)
 * are queued for LIMIT_COOLING_OFF_HOURS. Re-saving replaces any previous pending request.
 */
export function planLimitChange(
  current: PlayLimits,
  requested: PlayLimits,
  nowMs: number,
): { limits: PlayLimits; pending: PendingLimits | null } {
  const limits: PlayLimits = { ...current }
  const changes: Partial<PlayLimits> = {}
  for (const key of LIMIT_KEYS) {
    if (isTighterOrSame(current[key], requested[key])) limits[key] = requested[key]
    else changes[key] = requested[key]
  }
  const pending =
    Object.keys(changes).length > 0
      ? { changes, effectiveAt: new Date(nowMs + LIMIT_COOLING_OFF_HOURS * HOUR_MS).toISOString() }
      : null
  return { limits, pending }
}

/** Limits in force at `nowMs`, including any pending change whose cooling-off has ended. */
export function effectiveLimits(safety: Pick<SafetyState, 'limits' | 'pendingLimits'>, nowMs: number): PlayLimits {
  const p = safety.pendingLimits
  if (!p || Date.parse(p.effectiveAt) > nowMs) return safety.limits
  return { ...safety.limits, ...p.changes }
}

/** Reason the player is currently blocked from group entries and coin top-ups, if any. */
export function activeBlock(safety: Pick<SafetyState, 'timeoutUntil' | 'selfExcludedUntil'>, nowMs: number): string | null {
  if (safety.selfExcludedUntil && Date.parse(safety.selfExcludedUntil) > nowMs) return 'You are self-excluded from joining groups.'
  if (safety.timeoutUntil && Date.parse(safety.timeoutUntil) > nowMs) return 'You are on a time-out from joining groups.'
  return null
}

function spentSince(ledger: readonly LedgerEntry[], playerId: PlayerId, sinceMs: number): number {
  return ledger
    .filter((e) => e.playerId === playerId && e.type === 'entry' && Date.parse(e.createdAt) >= sinceMs)
    .reduce((sum, e) => sum - e.amount, 0)
}

/** Net loss in window = entries − prizes (never negative). */
function lossSince(ledger: readonly LedgerEntry[], playerId: PlayerId, sinceMs: number): number {
  const net = ledger
    .filter((e) => e.playerId === playerId && (e.type === 'entry' || e.type === 'prize') && Date.parse(e.createdAt) >= sinceMs)
    .reduce((sum, e) => sum + e.amount, 0)
  return Math.max(0, -net)
}

/**
 * Checks shared by every paid entry. In production the SAME checks must run on the server
 * (a client can always bypass UI checks); here they run in the mock "server" in state/actions.ts.
 */
export function canSpend(state: DemoState, amount: number, nowMs: number): Result {
  const pid = state.currentPlayerId
  if (state.config.maintenance) return { ok: false, reason: 'Groups are paused for maintenance.' }
  const block = activeBlock(state.safety, nowMs)
  if (block) return { ok: false, reason: block }
  const balance = balanceOf(state.ledger, pid)
  if (balance < amount) {
    return { ok: false, reason: `Not enough coins — you need ${formatCoins(amount - balance)} more to join.` }
  }
  const { hourlySpend, dailySpend, dailyLoss } = effectiveLimits(state.safety, nowMs)
  if (hourlySpend !== null && spentSince(state.ledger, pid, nowMs - HOUR_MS) + amount > hourlySpend) {
    return { ok: false, reason: 'This entry would exceed your hourly spend limit.' }
  }
  if (dailySpend !== null && spentSince(state.ledger, pid, nowMs - DAY_MS) + amount > dailySpend) {
    return { ok: false, reason: 'This entry would exceed your daily spend limit.' }
  }
  if (dailyLoss !== null && lossSince(state.ledger, pid, nowMs - DAY_MS) + amount > dailyLoss) {
    return { ok: false, reason: 'This entry could exceed your daily loss limit.' }
  }
  return { ok: true, value: undefined }
}

/** Fixes defect 4: join eligibility respects status, capacity, membership, balance and safety controls. */
export function canJoin(state: DemoState, groupId: string, nowMs: number): Result {
  const group = state.groups.find((g) => g.id === groupId)
  if (!group) return { ok: false, reason: 'This group no longer exists.' }
  if (group.status !== 'open') return { ok: false, reason: 'This group is no longer open.' }
  if (group.playerIds.length >= group.size) return { ok: false, reason: 'This group is full.' }
  if (group.playerIds.includes(state.currentPlayerId)) return { ok: false, reason: 'You are already in this group.' }
  return canSpend(state, group.entryFee, nowMs)
}

/** Remaining card numbers a player can choose (cards are unique per group). */
export function availableCards(group: Group, forPlayer: PlayerId): number[] {
  const taken = new Set(
    Object.entries(group.picks)
      .filter(([pid]) => pid !== forPlayer)
      .map(([, card]) => card),
  )
  return Array.from({ length: group.size }, (_, i) => i + 1).filter((c) => !taken.has(c))
}

export interface AdminSummary {
  totalRevenue: number
  totalDraws: number
  totalPlayers: number
  activeGroups: number
}

export function adminSummary(state: Pick<DemoState, 'groups' | 'players'>): AdminSummary {
  const settled = settledGroups(state.groups)
  return {
    totalRevenue: settled.reduce((s, g) => s + prizeBreakdown(g.entryFee, g.size, g.feePct).platformFee, 0),
    totalDraws: settled.length,
    totalPlayers: Object.keys(state.players).length,
    activeGroups: state.groups.filter((g) => g.status !== 'settled').length,
  }
}

export function playerLabel(state: Pick<DemoState, 'players'>, id: PlayerId | null): string {
  if (!id) return 'Unknown player'
  return state.players[id]?.label ?? 'Unknown player'
}
