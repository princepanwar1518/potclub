import { Link } from 'react-router'
import { usePageMeta } from '../lib/usePageMeta'

/**
 * Admin route. Secure default: no settings or maintenance controls render here until
 * the role-based guard (fix_plan task 12) exists. Real enforcement must live on a server.
 */
export function AdminPage() {
  usePageMeta({
    title: 'Restricted — Group draws',
    description: 'Administrator access is required.',
    noIndex: true,
  })

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Administrator access required</h1>
      <p className="mt-3 text-slate-600">You don't have permission to view this page.</p>
      <Link to="/dashboard" className="mt-6 inline-block font-medium text-[#5B3B9B] underline underline-offset-4">
        Go to dashboard
      </Link>
    </main>
  )
}
