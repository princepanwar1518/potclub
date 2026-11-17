import { describe, expect, it } from 'vitest'
import { balanceOf } from '../domain/rules'
import { createSeedState, GUEST_ID } from '../domain/seed'
import type { DemoState } from '../domain/types'
import { createGameActions, engineTick, simulationStep, type EngineDeps } from './engine'
import { demoReducer } from './reducer'

/** Seed without the open groups the guest already waits in, so simulated players fill the new group. */
function seedWithoutOpenGroups(): DemoState {
  const s = createSeedState()
  return { ...s, groups: s.groups.filter((g) => g.status === 'settled') }
}

/** Runs the shared engine against a plain reducer — exactly how the mobile app uses it. */
function harness(start: DemoState = seedWithoutOpenGroups(), nowMs = Date.parse('2026-11-17T08:00:00Z')) {
  let state = start
  let n = 0
  let clock = nowMs
  const deps: EngineDeps = {
    getState: () => state,
    dispatch: (a) => {
      state = demoReducer(state, a)
    },
    wait: () => Promise.resolve(),
    now: () => clock,
    uid: (p) => `${p}-${++n}`,
    randomInt: () => 0,
  }
  return {
    actions: createGameActions(deps),
    deps,
    get state() {
      return state
    },
    advance(ms: number) {
      clock += ms
    },
    tick() {
      for (const a of engineTick(state, clock, deps)) deps.dispatch(a)
    },
    simulate() {
      for (const a of simulationStep(state, clock, deps.randomInt)) deps.dispatch(a)
    },
  }
}

describe('shared engine (used by web and mobile)', () => {
  it('plays a full 5-player game: top-up → quick play → bots fill → pick → grace → settle', async () => {
    const h = harness()
    expect((await h.actions.addCoins(1000)).ok).toBe(true)
    const r = await h.actions.quickPlay(5)
    expect(r.ok).toBe(true)
    const id = r.ok ? r.value : ''
    for (let i = 0; i < 4; i++) h.simulate()
    expect(h.state.groups.find((g) => g.id === id)?.status).toBe('picking')
    expect((await h.actions.pickCard(id, 3)).ok).toBe(true)
    for (let i = 0; i < 4; i++) h.simulate() // bots pick
    h.tick() // all picked → grace
    expect(h.state.groups.find((g) => g.id === id)?.status).toBe('grace')
    h.advance(31_000)
    h.tick() // grace over → settle (randomInt=0 → card 1)
    const g = h.state.groups.find((x) => x.id === id)
    expect(g?.status).toBe('settled')
    expect(g?.winningCard).toBe(1)
    // Guest picked 3, so lost: 9,900 + 1,000 − 100 entry
    expect(balanceOf(h.state.ledger, GUEST_ID)).toBe(10800)
    expect(h.state.notifications[0]?.kind).toBe('loss')
  })

  it('validates inputs like a server would', async () => {
    const h = harness(createSeedState())
    expect(await h.actions.addCoins(50)).toEqual({ ok: false, reason: 'The minimum top-up is 200 coins.' })
    expect(await h.actions.addCoins(1.5)).toMatchObject({ ok: false })
    expect(await h.actions.applyReferral('REF-600001')).toEqual({ ok: false, reason: 'You cannot apply your own code.' })
    expect(await h.actions.updateConfig({ platformFeePct: 5 })).toEqual({ ok: false, reason: 'Administrator access is required.' })
    expect(await h.actions.pickCard('g-1001', 1)).toEqual({ ok: false, reason: 'Card picking is closed for this group.' })
  })

  it('auto-assigns free cards when the pick window expires', async () => {
    const h = harness()
    await h.actions.addCoins(1000)
    const r = await h.actions.quickPlay(5)
    const id = r.ok ? r.value : ''
    for (let i = 0; i < 4; i++) h.simulate()
    h.advance(121_000)
    h.tick()
    const g = h.state.groups.find((x) => x.id === id)
    expect(g?.status).toBe('grace')
    expect(new Set(Object.values(g?.picks ?? {})).size).toBe(5)
  })
})
