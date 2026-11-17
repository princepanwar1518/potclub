import { createContext, useContext } from 'react'
import type { DemoState, GroupSize, PlayLimits, Result } from '../domain/types'

/** Largest single free top-up. */
export const MAX_TOP_UP = 100000

export type LoadStatus = 'loading' | 'ready'

export interface DemoActions {
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
  markNotificationsRead(): void
  setBrowserAlerts(enabled: boolean): Promise<Result>
  toggleMute(): void
  updateConfig(patch: Partial<DemoState['config']>): Promise<Result>
  setRole(role: DemoState['role']): void
  resetDemo(): void
}

export interface StoreValue {
  state: DemoState
  status: LoadStatus
  actions: DemoActions
}

export const StoreContext = createContext<StoreValue | null>(null)
export const ClockContext = createContext<number>(Date.now())

export function useDemo(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useDemo must be used inside <DemoProvider>')
  return ctx
}

/** Current time, updated every second — for countdowns. */
export function useNow(): number {
  return useContext(ClockContext)
}
