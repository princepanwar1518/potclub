import { Bell, BellOff, History, Medal, Trophy } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '../../components/ui/Button'
import { EmptyState, Notice } from '../../components/ui/Notice'
import { Badge, Card } from '../../components/ui/primitives'
import { drawHistory, groupPrize, leaderboard, playerLabel } from '../../domain/rules'
import { formatDateTime, formatINR, formatNumber } from '../../lib/format'
import { cn } from '../../lib/cn'
import { useAsyncAction } from '../../lib/useAsyncAction'
import { useDemo } from '../../state/context'

export function HistoryTab() {
  const { state } = useDemo()
  const draws = drawHistory(state.groups)
  const me = state.currentPlayerId

  if (draws.length === 0) {
    return <EmptyState icon={<History className="size-6" />} title="No draws yet" body="Finished draws will appear here, newest first." />
  }

  return (
    <Card className="p-2 sm:p-3">
      <h3 className="px-3 pt-3 pb-2 text-lg">Recent draw results</h3>
      <ul className="divide-y divide-line-soft">
        {draws.map((g) => {
          const iWon = g.winnerId === me
          const iPlayed = g.playerIds.includes(me)
          return (
            <li key={g.id} className="flex flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-lilac-50 text-sm font-semibold text-lilac-600">
                {g.size}P
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-heading">
                  {g.size}-Player Draw #{g.number}{' '}
                  {iPlayed ? <Badge tone={iWon ? 'amber' : 'lilac'} className="ml-1">{iWon ? 'You won' : 'You played'}</Badge> : null}
                </p>
                <p className="text-xs text-muted">
                  <time dateTime={g.settledAt ?? undefined}>{g.settledAt ? formatDateTime(g.settledAt) : '—'}</time> · winning card{' '}
                  {g.winningCard}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Winner</p>
                <p className={cn('text-sm font-semibold', iWon ? 'text-amber-600' : 'text-heading')}>{iWon ? 'You' : playerLabel(state, g.winnerId)}</p>
              </div>
              <p className="w-24 text-right font-display text-lg font-semibold text-mint-600">{formatINR(groupPrize(g))}</p>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function LeaderboardTab() {
  const { state } = useDemo()
  const rows = leaderboard(state)
  const medal = ['text-amber-600', 'text-muted', 'text-[#b4693a]']

  if (rows.length === 0) {
    return <EmptyState icon={<Trophy className="size-6" />} title="No winners yet" body="The leaderboard fills in as draws are settled." />
  }

  return (
    <Card className="overflow-x-auto p-2 sm:p-3" tabIndex={0} role="region" aria-label="Scrollable table">
      <table className="w-full min-w-[420px] text-sm">
        <caption className="px-3 pt-3 pb-2 text-left font-display text-lg font-semibold text-heading">Top winners</caption>
        <thead>
          <tr className="text-left text-xs tracking-wider text-muted uppercase">
            <th scope="col" className="px-3 py-2 font-semibold">Rank</th>
            <th scope="col" className="px-3 py-2 font-semibold">Player</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Wins</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Winnings</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {rows.map((r) => {
            const isMe = r.player.id === state.currentPlayerId
            return (
              <tr key={r.player.id} className={cn(isMe && 'bg-lilac-50/70')}>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1 font-display font-semibold text-heading">
                    {r.rank <= 3 ? <Medal aria-hidden="true" className={cn('size-4', medal[r.rank - 1])} /> : null}#{r.rank}
                  </span>
                </td>
                <th scope="row" className="px-3 py-3 text-left font-medium text-heading">
                  {r.player.label} {isMe ? <Badge tone="lilac">You</Badge> : null}
                </th>
                <td className="px-3 py-3 text-right tabular-nums">{formatNumber(r.wins)}</td>
                <td className="px-3 py-3 text-right font-semibold text-mint-600 tabular-nums">{formatINR(r.winnings)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}

export function AlertsTab() {
  const { state, actions } = useDemo()
  const toggle = useAsyncAction()
  const unread = state.notifications.some((n) => !n.read)

  // Opening the tab marks alerts as read.
  useEffect(() => {
    if (unread) actions.markNotificationsRead()
  }, [unread, actions])

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg">Notifications</h3>
          <p className="text-sm text-muted">Win/loss alerts appear here after each draw you play.</p>
        </div>
        <Button
          variant={state.browserAlerts ? 'secondary' : 'primary'}
          size="sm"
          disabled={toggle.pending}
          aria-pressed={state.browserAlerts}
          onClick={() =>
            void toggle.run(
              () => actions.setBrowserAlerts(!state.browserAlerts),
              state.browserAlerts ? 'Browser alerts turned off.' : 'Browser alerts turned on.',
            )
          }
        >
          {state.browserAlerts ? <BellOff aria-hidden="true" className="size-4" /> : <Bell aria-hidden="true" className="size-4" />}
          {state.browserAlerts ? 'Disable browser alerts' : 'Enable browser alerts'}
        </Button>
      </Card>
      {toggle.state.status === 'error' ? <Notice tone="error">{toggle.state.message}</Notice> : null}
      {toggle.state.status === 'success' ? <Notice tone="success">{toggle.state.message}</Notice> : null}

      {state.notifications.length === 0 ? (
        <EmptyState icon={<Bell className="size-6" />} title="No notifications yet" body="Win/loss alerts will appear here after draws." />
      ) : (
        <ul className="space-y-2">
          {state.notifications.map((n) => (
            <li key={n.id}>
              <Card className="flex items-start gap-3 p-4">
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-xl',
                    n.kind === 'win' ? 'bg-amber-50 text-amber-600' : 'bg-lilac-50 text-lilac-600',
                  )}
                >
                  {n.kind === 'win' ? <Trophy className="size-4" /> : <Bell className="size-4" />}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-heading">{n.title}</p>
                  <p className="text-sm text-muted">{n.body}</p>
                  <p className="mt-1 text-xs text-muted">
                    <time dateTime={n.createdAt}>{formatDateTime(n.createdAt)}</time>
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
