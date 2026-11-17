import { Link } from 'react-router'
import { usePageMeta } from '../lib/usePageMeta'

/**
 * Landing route. Scaffold version: semantic shell with working navigation.
 * Hero, how-it-works, features and CTA sections are built in fix_plan tasks 4–5.
 */
export function LandingPage() {
  usePageMeta({
    title: 'Group draws — pick a number, enjoy the moment',
    description:
      'Join a small player group, pick a unique card and watch the live draw when the group fills. Demo experience with mock data.',
  })

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start justify-center gap-6 px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Pick a number. Enjoy the moment.</h1>
      <p className="text-lg text-slate-600">
        Join a friendly group, choose your lucky card, and share the excitement as the live draw unfolds when the
        group fills.
      </p>
      <Link
        to="/dashboard"
        className="rounded-2xl bg-[#6D5AE6] px-5 py-3 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5AE6]"
      >
        Find my group
      </Link>
    </main>
  )
}
