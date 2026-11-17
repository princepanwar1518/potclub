/** Shown while a lazily loaded route chunk downloads on first visit. */
export function RouteFallback() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-dvh items-center justify-center">
      <span className="size-8 animate-spin rounded-full border-2 border-indigo/20 border-t-indigo" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
