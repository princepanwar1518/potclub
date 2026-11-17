import { activeBlock, availableCards, canJoin, canSpend, DEFAULT_ENTRY_FEE, effectiveLimits, MAX_TOP_UP, planLimitChange } from '../domain/rules'
import type { DemoState, GroupSize, PlatformConfig, PlayLimits, Result } from '../domain/types'
import { formatCoins } from '../lib/format'
import { newGroup, type DemoAction } from './reducer'

/*
 * Platform-independent game engine shared by the web app and the native mobile app.
 * It is the mock "server": every action re-validates against the latest state before mutating.
 * Not security — production must run the same checks server-side (see fix_plan.md).
 * No DOM, browser or React Native APIs here: platforms inject time, randomness, ids and latency.
 */

export interface EngineDeps {
  getState(): DemoState
  dispatch(action: DemoAction): void
  /** Simulated network latency. */
  wait(): Promise<void>
  now(): number
  uid(prefix: string): string
  /** Unbiased random integer in [0, max). Must be a CSPRNG in production code paths. */
  randomInt(max: number): number
}

export interface GameActions {
  join(groupId: string): Promise<Result>
  quickPlay(size: GroupSize): Promise<Result<string>>
  pickCard(groupId: string, card: number): Promise<Result>
  revealNow(groupId: string): Promise<Result>
  /** Free play-coin top-up. Coins have no cash value; nothing is charged. */
  addCoins(amount: number): Promise<Result>
  applyReferral(code: string): Promise<Result>
  saveLimits(limits: PlayLimits): Promise<Result>
  takeTimeout(hours: number): Promise<Result>
  selfExclude(days: number): Promise<Result>
  updateConfig(patch: Partial<PlatformConfig>): Promise<Result>
}

const ok: Result = { ok: true, value: undefined }
const fail = (reason: string): { ok: false; reason: string } => ({ ok: false, reason })

export function isWholeCoins(n: number): boolean {
  return Number.isFinite(n) && Number.isInteger(n) && n > 0
}

export function createGameActions(deps: EngineDeps): GameActions {
  const at = () => new Date(deps.now()).toISOString()
  return {
      async join(groupId) {
        await deps.wait()
        const check = canJoin(deps.getState(), groupId, deps.now())
        if (!check.ok) return check
        deps.dispatch({ type: 'join', groupId, at: at(), ledgerId: deps.uid('l') })
        return ok
      },

      async quickPlay(size) {
        await deps.wait()
        const s = deps.getState()
        const nowMs = deps.now()
        // Prefer the fullest joinable group of that size so draws start sooner.
        const candidates = s.groups
          .filter((g) => g.size === size && canJoin(s, g.id, nowMs).ok)
          .sort((a, b) => b.playerIds.length - a.playerIds.length)
        const target = candidates[0]
        if (target) {
          deps.dispatch({ type: 'join', groupId: target.id, at: at(), ledgerId: deps.uid('l') })
          return { ok: true, value: target.id }
        }
        const fee = DEFAULT_ENTRY_FEE[size]
        const spend = canSpend(s, fee, nowMs)
        if (!spend.ok) return spend
        const id = deps.uid('g')
        deps.dispatch({
          type: 'createGroup',
          group: newGroup({ id, number: s.nextGroupNumber, size, entryFee: fee, feePct: s.config.platformFeePct, at: at() }),
        })
        deps.dispatch({ type: 'join', groupId: id, at: at(), ledgerId: deps.uid('l') })
        return { ok: true, value: id }
      },

      async pickCard(groupId, card) {
        await deps.wait()
        const s = deps.getState()
        const g = s.groups.find((x) => x.id === groupId)
        if (!g) return fail('This group no longer exists.')
        if (!g.playerIds.includes(s.currentPlayerId)) return fail('You are not in this group.')
        if (g.status !== 'picking' && g.status !== 'grace') return fail('Card picking is closed for this group.')
        if (!availableCards(g, s.currentPlayerId).includes(card)) return fail(`Card ${card} was just taken — choose another.`)
        deps.dispatch({ type: 'pick', groupId, playerId: s.currentPlayerId, card })
        return ok
      },

      async revealNow(groupId) {
        await deps.wait()
        const g = deps.getState().groups.find((x) => x.id === groupId)
        if (!g || g.status !== 'grace') return fail('The reveal is not ready yet.')
        deps.dispatch({ type: 'settle', groupId, at: at(), winningCard: deps.randomInt(g.size) + 1, notificationId: deps.uid('n'), ledgerId: deps.uid('l') })
        return ok
      },

      async addCoins(amount) {
        await deps.wait()
        const s = deps.getState()
        if (!isWholeCoins(amount)) return fail('Enter a whole number of coins.')
        if (amount < s.config.minTopUp) return fail(`The minimum top-up is ${formatCoins(s.config.minTopUp)}.`)
        if (amount > MAX_TOP_UP) return fail(`The maximum single top-up is ${formatCoins(MAX_TOP_UP)}.`)
        if (s.config.maintenance) return fail('Top-ups are paused for maintenance.')
        const block = activeBlock(s.safety, deps.now())
        if (block) return fail(`${block} Top-ups are paused until it ends.`)
        deps.dispatch({
          type: 'ledger',
          entry: { id: deps.uid('l'), playerId: s.currentPlayerId, type: 'topup', amount, description: 'Free coin top-up', createdAt: at() },
        })
        return ok
      },

      async applyReferral(raw) {
        await deps.wait()
        const s = deps.getState()
        const code = raw.trim().toUpperCase()
        if (s.referral.appliedCode) return fail('A referral code is already applied to this account.')
        if (!/^REF-\d{4,8}$/.test(code)) return fail('Codes look like REF-123456.')
        if (code === s.referral.code) return fail('You cannot apply your own code.')
        deps.dispatch({ type: 'applyReferral', code })
        return ok
      },

      async saveLimits(limits) {
        await deps.wait()
        for (const v of Object.values(limits)) {
          if (v !== null && !isWholeCoins(v)) return fail('Limits must be whole numbers of coins above 0.')
        }
        const { hourlySpend, dailySpend } = limits
        if (hourlySpend !== null && dailySpend !== null && hourlySpend > dailySpend) {
          return fail('Your hourly limit cannot be higher than your daily limit.')
        }
        const nowMs = deps.now()
        const s = deps.getState()
        // Fold in any pending change that has already matured before planning the new one.
        const base = effectiveLimits(s.safety, nowMs)
        const plan = planLimitChange(base, limits, nowMs)
        deps.dispatch({ type: 'saveLimits', limits: plan.limits, pending: plan.pending })
        return ok
      },

      async takeTimeout(hours) {
        await deps.wait()
        deps.dispatch({ type: 'timeout', until: new Date(deps.now() + hours * 3_600_000).toISOString() })
        return ok
      },

      async selfExclude(days) {
        await deps.wait()
        deps.dispatch({ type: 'selfExclude', until: new Date(deps.now() + days * 86_400_000).toISOString() })
        return ok
      },

      async updateConfig(patch) {
        await deps.wait()
        if (deps.getState().role !== 'admin') return fail('Administrator access is required.')
        if (patch.platformFeePct !== undefined && (!Number.isFinite(patch.platformFeePct) || patch.platformFeePct < 0 || patch.platformFeePct > 30)) {
          return fail('Platform fee must be between 0% and 30%.')
        }
        if (patch.platformFeePct !== undefined && Math.round(patch.platformFeePct * 100) !== patch.platformFeePct * 100) {
          return fail('Platform fee can have at most two decimal places.')
        }
        if (patch.minTopUp !== undefined) {
          if (!isWholeCoins(patch.minTopUp)) return fail('Minimum top-up must be a whole number of coins.')
          if (patch.minTopUp > MAX_TOP_UP) return fail(`Minimum top-up cannot exceed the ${formatCoins(MAX_TOP_UP)} top-up cap.`)
        }
        deps.dispatch({ type: 'updateConfig', patch })
        return ok
      },
  }
}

/**
 * Draw engine step: moves full groups from picking → grace (auto-assigning free cards to anyone who
 * did not pick) and settles groups whose grace period has ended. Pure: returns actions to dispatch.
 */
export function engineTick(state: DemoState, nowMs: number, deps: Pick<EngineDeps, 'randomInt' | 'uid'>): DemoAction[] {
  const out: DemoAction[] = []
  const at = new Date(nowMs).toISOString()
  for (const g of state.groups) {
    if (g.status === 'picking') {
      const allPicked = g.playerIds.every((p) => g.picks[p] !== undefined)
      if (allPicked || (g.phaseEndsAt && Date.parse(g.phaseEndsAt) <= nowMs)) {
        const picks = { ...g.picks }
        const autoPicks: Record<string, number> = {}
        for (const p of g.playerIds) {
          if (picks[p] !== undefined) continue
          const free = availableCards({ ...g, picks }, p)
          const card = free[deps.randomInt(free.length)] ?? 1
          picks[p] = card
          autoPicks[p] = card
        }
        out.push({ type: 'startGrace', groupId: g.id, at, autoPicks })
      }
    } else if (g.status === 'grace' && g.phaseEndsAt && Date.parse(g.phaseEndsAt) <= nowMs) {
      out.push({
        type: 'settle',
        groupId: g.id,
        at,
        winningCard: deps.randomInt(g.size) + 1,
        notificationId: deps.uid('n'),
        ledgerId: deps.uid('l'),
      })
    }
  }
  return out
}

/** Simulated other players: one joins the first group you are waiting in; bots pick cards in live draws. */
export function simulationStep(state: DemoState, nowMs: number, randomInt: (max: number) => number): DemoAction[] {
  const out: DemoAction[] = []
  const at = new Date(nowMs).toISOString()
  const mine = state.groups.find((g) => g.status === 'open' && g.playerIds.includes(state.currentPlayerId))
  if (mine) out.push({ type: 'addBot', groupId: mine.id, at })
  for (const g of state.groups) {
    if (g.status !== 'picking') continue
    const bot = g.playerIds.find((p) => p !== state.currentPlayerId && g.picks[p] === undefined)
    if (!bot) continue
    const free = availableCards(g, bot)
    const card = free[randomInt(free.length)]
    if (card !== undefined) out.push({ type: 'pick', groupId: g.id, playerId: bot, card })
  }
  return out
}
