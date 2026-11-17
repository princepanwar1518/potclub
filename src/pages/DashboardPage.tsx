import { Link } from 'react-router'
import { usePageMeta } from '../lib/usePageMeta'

/**
 * Player dashboard route. Scaffold version; stats, tabs and mock data arrive in fix_plan tasks 6–11.
 */
export function DashboardPage() {
  usePageMeta({
    title: 'Dashboard — Group draws',
    description: 'Your groups, draws, wallet and play-safety controls.',
    noIndex: true,
  })

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <p className="mt-3 text-slate-600">Player area. Demo data only — no real money is used.</p>
      <Link to="/" className="mt-6 inline-block font-medium text-[#5B3B9B] underline underline-offset-4">
        Back to home
      </Link>
    </main>
  )
}
