import { Outlet, ScrollRestoration } from 'react-router'
import { DemoProvider } from '../state/DemoStore'

const isTest = import.meta.env.MODE === 'test'

/** Root layout: one mock "backend" shared by every route so figures agree everywhere. */
export function AppRoot() {
  return (
    <DemoProvider latencyMs={isTest ? 0 : 350} simulate={!isTest} persistState={!isTest}>
      {isTest ? null : <ScrollRestoration />}
      <a
        href="#main"
        className="sr-only z-50 rounded-btn border border-cp-cyan bg-cp-black px-4 py-2 font-bold text-cp-cyan shadow-card focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Outlet />
    </DemoProvider>
  )
}
