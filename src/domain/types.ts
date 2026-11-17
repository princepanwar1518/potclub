/**
 * Mock domain model. Every figure on every screen is derived from this state
 * (fixes reference defects 3 and 6, where counters and leaderboard disagreed with history).
 * All money values are whole rupees (integers).
 */
export type GroupSize = 5 | 10 | 15 | 20
export const GROUP_SIZES: readonly GroupSize[] = [5, 10, 15, 20] as const

export type PlayerId = string

export interface Player {
  id: PlayerId
  /** Public handle shown in lists, e.g. "Player #600001". */
  label: string
  isBot: boolean
}

/**
 * Group lifecycle: open → picking (full, choosing cards) → grace (switch window) → settled.
 */
export type GroupStatus = 'open' | 'picking' | 'grace' | 'settled'

export interface Group {
  id: string
  /** Short display number, e.g. 1004. */
  number: number
  size: GroupSize
  entryFee: number
  /** Platform fee % captured when the group was created, so later config changes never rewrite history. */
  feePct: number
  playerIds: PlayerId[]
  /** card number (1..size) chosen by each player */
  picks: Record<PlayerId, number>
  status: GroupStatus
  createdAt: string
  /** ISO time when the current phase ends (picking or grace). */
  phaseEndsAt: string | null
  winnerId: PlayerId | null
  winningCard: number | null
  settledAt: string | null
}

export type LedgerType = 'deposit' | 'withdrawal' | 'entry' | 'prize' | 'bonus'

export interface LedgerEntry {
  id: string
  playerId: PlayerId
  type: LedgerType
  /** Signed amount: credits positive, debits negative. */
  amount: number
  description: string
  createdAt: string
  groupId?: string
}

export interface PlatformConfig {
  platformFeePct: number
  minDeposit: number
  maxWithdrawal: number
  maintenance: boolean
}

export interface PlayLimits {
  hourlySpend: number | null
  dailySpend: number | null
  dailyLoss: number | null
}

export interface SafetyState {
  limits: PlayLimits
  timeoutUntil: string | null
  selfExcludedUntil: string | null
}

export type NotificationKind = 'win' | 'loss' | 'info'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  createdAt: string
  read: boolean
}

export type Role = 'guest' | 'admin'

export interface Referral {
  code: string
  appliedCode: string | null
  successfulReferrals: number
  bonusesEarned: number
}

export interface DemoState {
  version: number
  currentPlayerId: PlayerId
  role: Role
  players: Record<PlayerId, Player>
  groups: Group[]
  ledger: LedgerEntry[]
  config: PlatformConfig
  safety: SafetyState
  notifications: AppNotification[]
  referral: Referral
  soundMuted: boolean
  browserAlerts: boolean
  nextGroupNumber: number
  nextPlayerNumber: number
}

export type Result<T = void> = { ok: true; value: T } | { ok: false; reason: string }
