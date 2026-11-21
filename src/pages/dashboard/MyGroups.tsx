import { Clock, LoaderCircle, PartyPopper, Trophy } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Notice } from '../../components/ui/Notice'
import { Badge, Card } from '../../components/ui/primitives'
import { WindowBar } from '../../components/ui/WindowBar'
import { availableCards, groupPrize, playerLabel } from '../../domain/rules'
import type { Group } from '../../domain/types'
import { formatCountdown, formatCoins } from '../../lib/format'
import { cn } from '../../lib/cn'
import { useAsyncAction } from '../../lib/useAsyncAction'
import { useDemo, useNow } from '../../state/context'

const RESULT_VISIBLE_MS = 3 * 60_000

function DrawRoom({ group }: { group: Group }) {
  const { state, actions } = useDemo()
  const now = useNow()
  const pick = useAsyncAction()
  const reveal = useAsyncAction()
  const me = state.currentPlayerId
  const myCard = group.picks[me]
  const free = new Set(availableCards(group, me))
  const secondsLeft = group.phaseEndsAt ? (Date.parse(group.phaseEndsAt) - now) / 1000 : 0
  const picked = Object.keys(group.picks).length
  const isGrace = group.status === 'grace'

  return (
    <Card className="overflow-hidden">
      <WindowBar tone={isGrace ? 'warn' : 'accent'} title={isGrace ? 'Last look before the reveal' : 'Pick your lucky number'} />
      <div className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl">
            {group.size}-Player Group #{group.number} · prize {formatCoins(groupPrize(group))}
          </h3>
          <p className="mt-1 text-sm text-muted">
            {isGrace
              ? 'You can still switch to any free card. The server reveals the winning card when the timer ends.'
              : `Choose a unique card. ${picked} of ${group.size} players have picked. Unpicked players get a random free card.`}
          </p>
        </div>
        <p
          className="inline-flex items-center gap-1.5 rounded-btn border-2 border-ink bg-warn px-3 py-1 font-display text-lg font-bold text-ink tabular-nums shadow-[3px_3px_0_#141414]"
          aria-live="off"
        >
          <Clock aria-hidden="true" className="size-4" />
          <span className="sr-only">Time left: </span>
          {formatCountdown(secondsLeft)}
        </p>
      </div>

      <div role="group" aria-label="Cards" className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: group.size }, (_, i) => i + 1).map((card) => {
          const mine = myCard === card
          const taken = !free.has(card)
          return (
            <button
              key={card}
              type="button"
              disabled={taken || pick.pending}
              aria-pressed={mine}
              aria-label={`Card ${card}${mine ? ', your card' : taken ? ', taken' : ''}`}
              onClick={() => void pick.run(() => actions.pickCard(group.id, card), `Card ${card} is yours.`)}
              className={cn(
                'aspect-[3/4] rounded-btn border-2 font-display text-xl font-bold transition',
                mine && 'border-ink bg-accent text-ink shadow-btn',
                !mine && taken && 'cursor-not-allowed border-ink/40 bg-lilac-50 text-ink/45 line-through',
                !mine && !taken && 'press border-ink bg-surface-2 text-ink shadow-[3px_3px_0_#141414]',
              )}
            >
              {card}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {myCard ? <Badge tone="lilac">Your card: {myCard}</Badge> : <Badge tone="amber">No card picked yet</Badge>}
        {isGrace ? (
          <Button size="sm" variant="secondary" disabled={reveal.pending} onClick={() => void reveal.run(() => actions.revealNow(group.id), 'Revealing…')}>
            {reveal.pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <PartyPopper aria-hidden="true" className="size-4" />}
            I'm happy — reveal now
          </Button>
        ) : null}
      </div>
      {pick.state.status === 'error' ? <Notice tone="error" className="mt-3">{pick.state.message}</Notice> : null}
      {reveal.state.status === 'error' ? <Notice tone="error" className="mt-3">{reveal.state.message}</Notice> : null}
      </div>
    </Card>
  )
}

function ResultCard({ group }: { group: Group }) {
  const { state } = useDemo()
  const won = group.winnerId === state.currentPlayerId
  return (
    <Card className={cn('p-5 sm:p-6 motion-safe:animate-fade-up', won && 'border-ink bg-warn/20')}>
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex size-16 shrink-0 items-center justify-center rounded-card font-display text-3xl font-semibold',
            won ? 'bg-amber-50 text-amber-600' : 'bg-lilac-50 text-lilac-600',
          )}
        >
          {group.winningCard}
        </span>
        <div role="status">
          <h3 className="flex items-center gap-2 text-xl">
            {won ? <Trophy aria-hidden="true" className="size-5 text-amber-600" /> : null}
            {won ? `You won ${formatCoins(groupPrize(group))}!` : `Card ${group.winningCard} won draw #${group.number}`}
          </h3>
          <p className="text-sm text-muted">
            {won
              ? 'Prize coins added to your balance. Coins have no cash value.'
              : `${playerLabel(state, group.winnerId)} takes ${formatCoins(groupPrize(group))}. Your card was ${group.picks[state.currentPlayerId] ?? '—'}.`}
          </p>
        </div>
      </div>
    </Card>
  )
}

/** Live draws and recent results for groups the current player is in. Renders nothing when idle. */
export function MyGroups() {
  const { state } = useDemo()
  const now = useNow()
  const me = state.currentPlayerId
  const mine = state.groups.filter((g) => g.playerIds.includes(me))
  const live = mine.filter((g) => g.status === 'picking' || g.status === 'grace')
  const waiting = mine.filter((g) => g.status === 'open')
  const recent = mine.filter((g) => g.status === 'settled' && g.settledAt && now - Date.parse(g.settledAt) < RESULT_VISIBLE_MS)

  if (live.length === 0 && waiting.length === 0 && recent.length === 0) return null

  return (
    <section aria-labelledby="my-groups-title" className="space-y-3">
      <h2 id="my-groups-title" className="text-xl">
        Your groups
      </h2>
      {live.map((g) => (
        <DrawRoom key={g.id} group={g} />
      ))}
      {recent.map((g) => (
        <ResultCard key={g.id} group={g} />
      ))}
      {waiting.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {waiting.map((g) => (
            <li key={g.id} className="rounded-btn border-2 border-ink bg-surface px-3 py-1.5 text-sm text-ink shadow-[3px_3px_0_#141414]">
              <span className="font-semibold text-heading">#{g.number}</span> · {g.size}-player · waiting {g.playerIds.length}/{g.size}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
