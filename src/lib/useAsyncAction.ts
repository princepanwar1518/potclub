import { useCallback, useEffect, useRef, useState } from 'react'
import type { Result } from '../domain/types'

export type ActionState = { status: 'idle' } | { status: 'pending' } | { status: 'success'; message: string } | { status: 'error'; message: string }

/**
 * Runs a mock-server action and exposes pending/success/error state for buttons and messages.
 * Ignores results that arrive after unmount.
 */
export function useAsyncAction() {
  const [state, setState] = useState<ActionState>({ status: 'idle' })
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const run = useCallback(async <T,>(fn: () => Promise<Result<T>>, successMessage: string): Promise<Result<T>> => {
    setState({ status: 'pending' })
    let result: Result<T>
    try {
      result = await fn()
    } catch {
      result = { ok: false, reason: 'Something went wrong. Please try again.' }
    }
    if (mounted.current) {
      setState(result.ok ? { status: 'success', message: successMessage } : { status: 'error', message: result.reason })
    }
    return result
  }, [])

  const reset = useCallback(() => setState({ status: 'idle' }), [])

  return { state, run, reset, pending: state.status === 'pending' }
}
