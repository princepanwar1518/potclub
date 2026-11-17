import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { createSeedState } from '../domain/seed'
import type { DemoState, Result } from '../domain/types'
import { playChime } from '../lib/sound'
import { ClockContext, StoreContext, type DemoActions, type LoadStatus } from './context'
import { demoReducer } from './reducer'
import { createGameActions, engineTick, simulationStep } from './engine'
import { parsePersistedState } from './validate'

/*
 * DemoStore is a stand-in for a backend. Every action re-validates against the latest state
 * (like a server would) before mutating. It is NOT security: a production build must run the
 * same checks server-side with real authentication. See fix_plan.md → "Backend requirements".
 */

const STORAGE_KEY = 'group-draws-demo-state'

function loadPersisted(): DemoState | null {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  const state = parsePersistedState(raw)
  if (raw !== null && state === null) {
    // Corrupt, outdated or hand-edited data: discard it so the app can never get stuck on it.
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
  return state
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
  // Stable getter so actions always validate against the latest state (read at call time, not render).
  const getState = useCallback(() => stateRef.current, [])

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
    for (const action of engineTick(stateRef.current, now, { randomInt, uid })) dispatch(action)
  }, [now])

  // Simulated players: fill groups the current player is waiting in, and pick cards quickly.
  useEffect(() => {
    if (!simulate) return
    const t = setInterval(() => {
      for (const action of simulationStep(stateRef.current, Date.now(), randomInt)) dispatch(action)
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

  // Event-time only: forget which notifications were already announced when the demo is reset.
  const resetSeenNotes = useCallback(() => {
    seenNotes.current = new Set(createSeedState().notifications.map((n) => n.id))
  }, [])

  // The ref is only read when an action runs (event time), never during render: createGameActions
  // stores `getState` and calls it inside async handlers. (react/refs is turned off for this file in .oxlintrc.json for that reason.)
  const actions = useMemo<DemoActions>(() => {
    const game = createGameActions({
      getState,
      dispatch,
      wait,
      now: () => Date.now(),
      uid,
      randomInt,
    })
    return {
      ...game,

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

      setRole(role) {
        dispatch({ type: 'setRole', role })
      },

      resetDemo() {
        resetSeenNotes()
        dispatch({ type: 'replace', state: createSeedState() })
      },
    }
  }, [wait, getState, resetSeenNotes])

  const value = useMemo(() => ({ state, status, actions }), [state, status, actions])

  return (
    <StoreContext.Provider value={value}>
      <ClockContext.Provider value={now}>{children}</ClockContext.Provider>
    </StoreContext.Provider>
  )
}
