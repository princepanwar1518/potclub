import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

/** Catches loader/render errors so users never see a blank screen. */
export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Something went wrong while loading this page.'

  return (
    <main id="main" role="alert" className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="text-slate-600">{message}</p>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-btn border-2 border-ink bg-accent px-4 py-2 font-bold text-black uppercase"
        >
          Try again
        </button>
        <Link to="/" className="self-center font-medium text-info-ink underline underline-offset-4">
          Back to home
        </Link>
      </div>
    </main>
  )
}
