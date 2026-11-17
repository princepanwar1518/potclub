import { LayoutGrid, LoaderCircle, Sparkles } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { EmptyState, Notice } from '../../components/ui/Notice'
import { Badge, Card } from '../../components/ui/primitives'
import { canJoin, DEFAULT_ENTRY_FEE, openGroups, prizeBreakdown } from '../../domain/rules'
import { GROUP_SIZES, type Group, type GroupSize } from '../../domain/types'
import { formatINR } from '../../lib/format'
import { cn } from '../../lib/cn'
import { useAsyncAction } from '../../lib/useAsyncAction'
import { useDemo, useNow } from '../../state/context'

function GroupCard({ group }: { group: Group }) {
  const { state, actions } = useDemo()
  const now = useNow()
  const { run, state: action, pending } = useAsyncAction()
  const reasonId = useId()
  const joined = group.playerIds.includes(state.currentPlayerId)
  const eligibility = canJoin(state, group.id, now)
  const { grossPool, platformFee, prize } = prizeBreakdown(group.entryFee, group.size, group.feePct)
  const filled = group.playerIds.length
  const pct = Math.round((filled / group.size) * 100)

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg">
          {group.size}-Player Group <span className="font-sans text-sm font-normal text-muted">#{group.number}</span>
        </h3>
        {joined ? <Badge tone="lilac">Joined</Badge> : <Badge tone="mint">Open</Badge>}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Entry fee</dt>
          <dd className="font-display text-xl font-semibold text-mint-600">{formatINR(group.entryFee)}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Prize pool</dt>
          <dd className="font-display text-xl font-semibold text-amber-600">{formatINR(prize)}</dd>
        </div>
      </dl>
      <p className="mt-1 text-xs text-muted">
        {formatINR(grossPool)} collected − {formatINR(platformFee)} ({group.feePct}% fee)
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <span className="text-muted">Players</span>
        <div className="flex items-center gap-2">
          <div
            role="progressbar"
            aria-label={`${filled} of ${group.size} players joined`}
            aria-valuemin={0}
            aria-valuemax={group.size}
            aria-valuenow={filled}
            className="h-1.5 w-24 overflow-hidden rounded-full bg-lilac-50"
          >
            <div className="h-full rounded-full bg-brand-gradient transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-semibold text-heading tabular-nums">
            {filled}/{group.size}
          </span>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <Button
          className="w-full"
          disabled={!eligibility.ok || pending}
          aria-describedby={!eligibility.ok ? reasonId : undefined}
          onClick={() => void run(() => actions.join(group.id), `You joined group #${group.number}. ${formatINR(group.entryFee)} play money deducted.`)}
        >
          {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
          {joined ? 'Waiting for players' : pending ? 'Joining…' : 'Join Group'}
        </Button>
        {!eligibility.ok && !joined ? (
          <p id={reasonId} className="mt-2 text-xs text-danger">
            {eligibility.reason}
          </p>
        ) : null}
        {action.status === 'error' ? <Notice tone="error" className="mt-2">{action.message}</Notice> : null}
        {action.status === 'success' ? <Notice tone="success" className="mt-2">{action.message}</Notice> : null}
      </div>
    </Card>
  )
}

export function GroupsTab() {
  const { state, status, actions } = useDemo()
  const [filter, setFilter] = useState<GroupSize | 'all'>('all')
  const quick = useAsyncAction()
  const groups = openGroups(state.groups)
    .filter((g) => filter === 'all' || g.size === filter)
    .sort((a, b) => a.size - b.size || b.playerIds.length - a.playerIds.length)

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-[linear-gradient(110deg,rgb(241_237_255/0.95),rgb(255_233_239/0.8)_55%,rgb(220_247_236/0.85))] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg">
              <Sparkles aria-hidden="true" className="size-5 text-amber-600" /> Quick Play
            </h3>
            <p className="mt-1 text-sm text-muted">Pick a group size and jump straight into the fun.</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Quick play group size">
            {GROUP_SIZES.map((size) => (
              <Button
                key={size}
                size="sm"
                variant="secondary"
                className="rounded-full bg-white"
                disabled={quick.pending}
                title={`Join or start a ${size}-player group (${formatINR(DEFAULT_ENTRY_FEE[size])} entry)`}
                onClick={() => void quick.run(() => actions.quickPlay(size), `You're in a ${size}-player group. We'll start the draw as soon as it fills.`)}
              >
                {size}P <span className="text-xs font-normal text-muted">{formatINR(DEFAULT_ENTRY_FEE[size])}</span>
              </Button>
            ))}
          </div>
        </div>
        {quick.state.status === 'error' ? <Notice tone="error" className="mt-3">{quick.state.message}</Notice> : null}
        {quick.state.status === 'success' ? <Notice tone="success" className="mt-3">{quick.state.message}</Notice> : null}
      </Card>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter open groups by size">
        {(['all', ...GROUP_SIZES] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm font-medium transition',
              filter === f ? 'border-indigo/30 bg-lilac-50 text-violet' : 'border-line-soft bg-white/70 text-muted hover:text-violet',
            )}
          >
            {f === 'all' ? 'All sizes' : `${f} players`}
          </button>
        ))}
      </div>

      {status === 'loading' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading groups">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 skeleton rounded-card" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="size-6" />}
          title="No open groups of this size"
          body="Use Quick Play above to start one — the draw begins as soon as it fills."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <li key={g.id} className="flex">
              <div className="w-full">
                <GroupCard group={g} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
