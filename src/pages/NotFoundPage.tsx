import { Link } from 'react-router'
import { usePageMeta } from '../lib/usePageMeta'

export function NotFoundPage() {
  usePageMeta({
    title: 'Page not found — Group draws',
    description: 'The page you were looking for does not exist.',
    noIndex: true,
  })

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-4 px-6">
      <p className="text-sm font-semibold tracking-widest text-[#6D5AE6] uppercase">Error 404</p>
      <h1 className="text-3xl font-semibold">We couldn't find that page</h1>
      <p className="text-slate-600">The link may be broken or the page may have moved.</p>
      <Link to="/" className="font-medium text-[#5B3B9B] underline underline-offset-4">
        Back to home
      </Link>
    </main>
  )
}
