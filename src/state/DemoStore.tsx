import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { availableCards, balanceOf, canJoin, canSpend, DEFAULT_ENTRY_FEE } from '../domain/rules'
import { createSeedState, STATE_VERSION } from '../domain/seed'
import type { DemoState, Result } from '../domain/types'
import { formatINR } from '../lib/format'
import { playChime } from '../lib/sound'
import { ClockContext, MAX_DEPOSIT, StoreContext, type DemoActions, type LoadStatus } from './context'
import { demoReducer, newGroup } from './reducer'

/*
 * DemoStore is a stand-in for a backend. Every action re-validates against the latest state
 * (like a server would) before mutating. It is NOT security: a production build must run the
 * same checks server-side with real authentication. See fix_plan.md → "Backend requirements".
 */

const STORAGE_KEY = 'group-draws-demo-state'

function loadPersisted(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DemoState>
    if (parsed.version !== STATE_VERSION || !Array.isArray(parsed.groups) || !Array.isArray(parsed.ledger)) return null
    // Role is never restored from storage: elevated access must not survive a reload.
    return { ...(parsed as DemoState), role: 'guest' }
  } catch {
    return null
  }
}

function persist(state: DemoState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, role: 'guest' }))
  } catch {
    /* storage unavailable (private mode / quota) — demo keeps working in memory */
  }
}

let idCounter = 0
function uid(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

/** Unbiased random integer in [0, max) using the Web Crypto API. */
function randomInt(max: number): number {
  const buf = new Uint32Array(1)
  const limit = Math.floor(0x1_0000_0000 / max) * max
  do {
    crypto.getRandomValues(buf)
  } while ((buf[0] ?? 0) >= limit)
  return (buf[0] ?? 0) % max
}

const ok: Result = { ok: true, value: undefined }
const fail = (reason: string): { ok: false; reason: string } => ({ ok: false, reason })

function isWholeRupees(n: number): boolean {
  return Number.isFinite(n) && Number.isInteger(n) && n > 0
}

export interface DemoProviderProps {
  children: ReactNode
  /** Simulated network latency for actions and first load. */
  latencyMs?: number
  /** Simulated other players joining your groups and drawing. Disabled in tests. */
  simulate?: boolean
  initialState?: DemoState
  persistState?: boolean
}

export function DemoProvider({
  children,
  latencyMs = 350,
  simulate = true,
  initialState,
  persistState = true,
}: DemoProviderProps) {
  const [state, dispatch] = useReducer(
    demoReducer,
    undefined,
    () => initialState ?? (persistState ? loadPersisted() : null) ?? createSeedState(),
  )
  const [status, setStatus] = useState<LoadStatus>(latencyMs > 0 ? 'loading' : 'ready')
  const [now, setNow] = useState(() => Date.now())
  const stateRef = useRef(state)
  useLayoutEffect(() => {
    stateRef.current = state
  }, [state])

  const wait = useCallback(() => new Promise<void>((r) => setTimeout(r, latencyMs)), [latencyMs])

  // First load (mirrors fetching from an API so skeleton states are real, fixes defect 7).
  useEffect(() => {
    if (latencyMs <= 0) return
    const t = setTimeout(() => setStatus('ready'), latencyMs)
    return () => clearTimeout(t)
  }, [latencyMs])

  useEffect(() => {
    if (persistState) persist(state)
  }, [state, persistState])

  // One-second clock for countdowns.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Draw engine: phase transitions run whether or not simulation of other players is on.
  useEffect(() => {
    const s = stateRef.current
    const at = new Date(now).toISOString()
    for (const g of s.groups) {
      if (g.status === 'picking') {
        const allPicked = g.playerIds.every((p) => g.picks[p] !== undefined)
        if (allPicked || (g.phaseEndsAt && Date.parse(g.phaseEndsAt) <= now)) {
          // Anyone who did not pick gets a random free card.
          const picks = { ...g.picks }
          const autoPicks: Record<string, number> = {}
          for (const p of g.playerIds) {
            if (picks[p] !== undefined) continue
            const free = availableCards({ ...g, picks }, p)
            const card = free[randomInt(free.length)] ?? 1
            picks[p] = card
            autoPicks[p] = card
          }
          dispatch({ type: 'startGrace', groupId: g.id, at, autoPicks })
        }
      } else if (g.status === 'grace' && g.phaseEndsAt && Date.parse(g.phaseEndsAt) <= now) {
        dispatch({ type: 'settle', groupId: g.id, at, winningCard: randomInt(g.size) + 1, notificationId: uid('n'), ledgerId: uid('l') })
      }
    }
  }, [now])

  // Simulated players: fill groups the current player is waiting in, and pick cards quickly.
  useEffect(() => {
    if (!simulate) return
    const t = setInterval(() => {
      const s = stateRef.current
      const at = new Date().toISOString()
      const mine = s.groups.find((g) => g.status === 'open' && g.playerIds.includes(s.currentPlayerId))
      if (mine) dispatch({ type: 'addBot', groupId: mine.id, at })
      for (const g of s.groups) {
        if (g.status !== 'picking') continue
        const bot = g.playerIds.find((p) => p !== s.currentPlayerId && g.picks[p] === undefined)
        if (!bot) continue
        const free = availableCards(g, bot)
        const card = free[randomInt(free.length)]
        if (card !== undefined) dispatch({ type: 'pick', groupId: g.id, playerId: bot, card })
      }
    }, 1500)
    return () => clearInterval(t)
  }, [simulate])

  // Sound + browser alerts for new unread notifications.
  const seenNotes = useRef(new Set(state.notifications.map((n) => n.id)))
  useEffect(() => {
    for (const n of state.notifications) {
      if (seenNotes.current.has(n.id)) continue
      seenNotes.current.add(n.id)
      if (!state.soundMuted) playChime(n.kind === 'win')
      if (state.browserAlerts && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(n.title, { body: n.body })
        } catch {
          /* some platforms only allow notifications from a service worker */
        }
      }
    }
  }, [state.notifications, state.soundMuted, state.browserAlerts])

  const actions = useMemo<DemoActions>(() => {
    const at = () => new Date().toISOString()
    const current = () => stateRef.current

    return {
      async join(groupId) {
        await wait()
        const check = canJoin(current(), groupId, Date.now())
        if (!check.ok) return check
        dispatch({ type: 'join', groupId, at: at(), ledgerId: uid('l') })
        return ok
      },

      async quickPlay(size) {
        await wait()
        const s = current()
        const nowMs = Date.now()
        // Prefer the fullest joinable group of that size so draws start sooner.
        const candidates = s.groups
          .filter((g) => g.size === size && canJoin(s, g.id, nowMs).ok)
          .sort((a, b) => b.playerIds.length - a.playerIds.length)
        const target = candidates[0]
        if (target) {
          dispatch({ type: 'join', groupId: target.id, at: at(), ledgerId: uid('l') })
          return { ok: true, value: target.id }
        }
        const fee = DEFAULT_ENTRY_FEE[size]
        const spend = canSpend(s, fee, nowMs)
        if (!spend.ok) return spend
        const id = uid('g')
        dispatch({
          type: 'createGroup',
          group: newGroup({ id, number: s.nextGroupNumber, size, entryFee: fee, feePct: s.config.platformFeePct, at: at() }),
        })
        dispatch({ type: 'join', groupId: id, at: at(), ledgerId: uid('l') })
        return { ok: true, value: id }
      },

      async pickCard(groupId, card) {
        await wait()
        const s = current()
        const g = s.groups.find((x) => x.id === groupId)
        if (!g) return fail('This group no longer exists.')
        if (!g.playerIds.includes(s.currentPlayerId)) return fail('You are not in this group.')
        if (g.status !== 'picking' && g.status !== 'grace') return fail('Card picking is closed for this group.')
        if (!availableCards(g, s.currentPlayerId).includes(card)) return fail(`Card ${card} was just taken — choose another.`)
        dispatch({ type: 'pick', groupId, playerId: s.currentPlayerId, card })
        return ok
      },

      async revealNow(groupId) {
        await wait()
        const g = current().groups.find((x) => x.id === groupId)
        if (!g || g.status !== 'grace') return fail('The reveal is not ready yet.')
        dispatch({ type: 'settle', groupId, at: at(), winningCard: randomInt(g.size) + 1, notificationId: uid('n'), ledgerId: uid('l') })
        return ok
      },

      async deposit(amount) {
        await wait()
        const s = current()
        if (!isWholeRupees(amount)) return fail('Enter a whole rupee amount.')
        if (amount < s.config.minDeposit) return fail(`The minimum deposit is ${formatINR(s.config.minDeposit)}.`)
        if (amount > MAX_DEPOSIT) return fail(`The maximum single deposit is ${formatINR(MAX_DEPOSIT)}.`)
        if (s.config.maintenance) return fail('Deposits are paused for maintenance.')
        dispatch({
          type: 'ledger',
          entry: { id: uid('l'), playerId: s.currentPlayerId, type: 'deposit', amount, description: 'Demo deposit (play money)', createdAt: at() },
        })
        return ok
      },

      async withdraw(amount) {
        await wait()
        const s = current()
        if (!isWholeRupees(amount)) return fail('Enter a whole rupee amount.')
        const balance = balanceOf(s.ledger, s.currentPlayerId)
        if (amount > balance) return fail(`You can withdraw up to ${formatINR(balance)}.`)
        if (amount > s.config.maxWithdrawal) return fail(`The maximum withdrawal is ${formatINR(s.config.maxWithdrawal)}.`)
        dispatch({
          type: 'ledger',
          entry: { id: uid('l'), playerId: s.currentPlayerId, type: 'withdrawal', amount: -amount, description: 'Demo withdrawal (play money)', createdAt: at() },
        })
        return ok
      },

      async applyReferral(raw) {
        await wait()
        const s = current()
        const code = raw.trim().toUpperCase()
        if (s.referral.appliedCode) return fail('A referral code is already applied to this account.')
        if (!/^REF-\d{4,8}$/.test(code)) return fail('Codes look like REF-123456.')
        if (code === s.referral.code) return fail('You cannot apply your own code.')
        dispatch({ type: 'applyReferral', code })
        return ok
      },

      async saveLimits(limits) {
        await wait()
        for (const v of Object.values(limits)) {
          if (v !== null && !isWholeRupees(v)) return fail('Limits must be whole rupee amounts above ₹0.')
        }
        const { hourlySpend, dailySpend } = limits
        if (hourlySpend !== null && dailySpend !== null && hourlySpend > dailySpend) {
          return fail('Your hourly limit cannot be higher than your daily limit.')
        }
        dispatch({ type: 'saveLimits', limits })
        return ok
      },

      async takeTimeout(hours) {
        await wait()
        dispatch({ type: 'timeout', until: new Date(Date.now() + hours * 3_600_000).toISOString() })
        return ok
      },

      async selfExclude(days) {
        await wait()
        dispatch({ type: 'selfExclude', until: new Date(Date.now() + days * 86_400_000).toISOString() })
        return ok
      },

      markNotificationsRead() {
        dispatch({ type: 'notificationsRead' })
      },

      async setBrowserAlerts(enabled) {
        if (!enabled) {
          dispatch({ type: 'setBrowserAlerts', enabled: false })
          return ok
        }
        if (typeof Notification === 'undefined') return fail('This browser does not support notifications.')
        const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
        if (permission !== 'granted') return fail('Notifications are blocked in your browser settings.')
        dispatch({ type: 'setBrowserAlerts', enabled: true })
        return ok
      },

      toggleMute() {
        dispatch({ type: 'toggleMute' })
      },

      async updateConfig(patch) {
        await wait()
        if (current().role !== 'admin') return fail('Administrator access is required.')
        if (patch.platformFeePct !== undefined && (!Number.isFinite(patch.platformFeePct) || patch.platformFeePct < 0 || patch.platformFeePct > 30)) {
          return fail('Platform fee must be between 0% and 30%.')
        }
        if (patch.minDeposit !== undefined && !isWholeRupees(patch.minDeposit)) return fail('Minimum deposit must be a whole rupee amount.')
        if (patch.maxWithdrawal !== undefined && !isWholeRupees(patch.maxWithdrawal)) return fail('Maximum withdrawal must be a whole rupee amount.')
        dispatch({ type: 'updateConfig', patch })
        return ok
      },

      setRole(role) {
        dispatch({ type: 'setRole', role })
      },

      resetDemo() {
        seenNotes.current = new Set(createSeedState().notifications.map((n) => n.id))
        dispatch({ type: 'replace', state: createSeedState() })
      },
    }
  }, [wait])

  const value = useMemo(() => ({ state, status, actions }), [state, status, actions])

  return (
    <StoreContext.Provider value={value}>
      <ClockContext.Provider value={now}>{children}</ClockContext.Provider>
    </StoreContext.Provider>
  )
}
