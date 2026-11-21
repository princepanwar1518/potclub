import { ArrowDownLeft, Copy, Gift, RotateCcw, Trophy, Wallet } from 'lucide-react'
import { lazy, Suspense, useId, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { EmptyState, Notice } from '../../components/ui/Notice'
import { Card } from '../../components/ui/primitives'
import { balanceOf } from '../../domain/rules'
import type { LedgerEntry, LedgerType, Result } from '../../domain/types'
import { formatCoins, formatDateTime, formatNumber, formatSignedCoins } from '../../lib/format'
import { cn } from '../../lib/cn'
import { useAsyncAction, type ActionState } from '../../lib/useAsyncAction'
import { MAX_TOP_UP, useDemo } from '../../state/context'

const TOP_UP_PRESETS = [500, 1000, 5000] as const

/*
 * Connect-wallet DESIGN PROTOTYPE (never contacts a bank, never stores details). Shown in development
 * builds, or when VITE_BANK_LINK_PROTOTYPE=true is set for a design review. The condition is written
 * inline so Vite replaces it with a constant and production builds drop the chunk entirely.
 * Do not enable in a public build: real bank linking for this game is not legal in India without a
 * qualified legal opinion (Promotion and Regulation of Online Gaming Act, 2025).
 */
const ConnectWalletCard =
  import.meta.env.DEV || import.meta.env.VITE_BANK_LINK_PROTOTYPE === 'true'
    ? lazy(async () => ({ default: (await import('./ConnectWallet')).ConnectWalletCard }))
    : null

const typeMeta: Record<LedgerType, { label: string; icon: typeof Wallet; tone: string }> = {
  topup: { label: 'Coin top-up', icon: ArrowDownLeft, tone: 'bg-mint-50 text-mint-600' },
  entry: { label: 'Game entry', icon: Wallet, tone: 'bg-lilac-50 text-lilac-600' },
  prize: { label: 'Prize', icon: Trophy, tone: 'bg-amber-50 text-amber-600' },
  bonus: { label: 'Bonus', icon: Gift, tone: 'bg-pink-50 text-pink-600' },
}

function Feedback({ state }: { state: ActionState }) {
  if (state.status === 'error') return <Notice tone="error" className="mt-3">{state.message}</Notice>
  if (state.status === 'success') return <Notice tone="success" className="mt-3">{state.message}</Notice>
  return null
}

/** Parses "1,000" / "1000" → 1000; anything else → NaN so validation can explain the problem. */
function parseCoins(raw: string): number {
  const cleaned = raw.replace(/[,\s]/g, '')
  return /^\d+$/.test(cleaned) ? Number(cleaned) : Number.NaN
}

function TopUpForm({
  title,
  description,
  submitLabel,
  presets,
  min,
  max,
  onSubmit,
}: {
  title: string
  description: string
  submitLabel: string
  presets?: readonly number[]
  min: number
  max: number
  onSubmit: (amount: number) => Promise<Result>
}) {
  const id = useId()
  const [value, setValue] = useState('')
  const { state, run, pending } = useAsyncAction()

  async function submit(e: FormEvent) {
    e.preventDefault()
    const amount = parseCoins(value)
    const res = await run(() => onSubmit(amount), `${formatCoins(amount)} added to your balance.`)
    if (res.ok) setValue('')
  }

  return (
    <Card className="p-5">
      <h3 className="text-lg">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <form onSubmit={(e) => void submit(e)} className="mt-4" noValidate>
        <label htmlFor={id} className="text-sm font-medium text-heading">
          Amount (coins)
        </label>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder={`${formatNumber(min)} – ${formatNumber(max)}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1.5 h-11 w-full rounded-btn border border-line bg-surface-2 px-3 text-base text-heading outline-none transition placeholder:text-muted/60 focus:border-indigo focus:ring-2 focus:ring-indigo/20"
        />
        {presets ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setValue(String(p))}
                className="rounded-btn border border-line-soft bg-surface-2 px-3 py-1 text-sm font-medium text-violet transition hover:border-indigo/30 hover:bg-lilac-50"
              >
                {formatNumber(p)}
              </button>
            ))}
          </div>
        ) : null}
        <Button type="submit" className="mt-4 w-full" disabled={pending || value.trim() === ''}>
          {pending ? 'Processing…' : submitLabel}
        </Button>
      </form>
      <Feedback state={state} />
    </Card>
  )
}

function Transactions({ entries }: { entries: LedgerEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState icon={<Wallet className="size-6" />} title="No transactions yet" body="Top-ups, entries and prizes will be listed here." />
  }
  return (
    <ul className="divide-y divide-line-soft">
      {entries.map((e) => {
        const meta = typeMeta[e.type]
        return (
          <li key={e.id} className="flex items-center gap-3 px-3 py-3">
            <span aria-hidden="true" className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-btn', meta.tone)}>
              <meta.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-heading">{meta.label}</p>
              <p className="truncate text-xs text-muted">
                {e.description} · <time dateTime={e.createdAt}>{formatDateTime(e.createdAt)}</time>
              </p>
            </div>
            <p className={cn('font-semibold tabular-nums', e.amount >= 0 ? 'text-mint-600' : 'text-danger')}>{formatSignedCoins(e.amount)}</p>
          </li>
        )
      })}
    </ul>
  )
}

function Referral() {
  const { state, actions } = useDemo()
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const apply = useAsyncAction()
  const inputId = useId()

  async function copy() {
    try {
      await navigator.clipboard.writeText(state.referral.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 text-lg">
        <Gift aria-hidden="true" className="size-5 text-pink-600" /> Invite friends
      </h3>
      <p className="mt-1 text-sm text-muted">Your referral code</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 rounded-btn border border-dashed border-indigo/30 bg-lilac-50 px-3 py-2 font-mono text-sm font-semibold text-violet">
          {state.referral.code}
        </code>
        <Button size="sm" variant="secondary" onClick={() => void copy()} aria-label="Copy referral code">
          <Copy aria-hidden="true" className="size-4" /> {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Successful referrals: {state.referral.successfulReferrals} · Bonuses earned: {formatCoins(state.referral.bonusesEarned)}
      </p>

      {state.referral.appliedCode ? (
        <Notice tone="info" className="mt-4">
          Code <strong>{state.referral.appliedCode}</strong> is applied to your account.
        </Notice>
      ) : (
        <form
          className="mt-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void apply.run(() => actions.applyReferral(code), 'Referral code applied.')
          }}
        >
          <label htmlFor={inputId} className="text-sm font-medium text-heading">
            Have a referral code?
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id={inputId}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="REF-123456"
              autoComplete="off"
              className="h-10 min-w-0 flex-1 rounded-btn border border-line bg-surface-2 px-3 text-sm uppercase outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
            />
            <Button type="submit" size="sm" disabled={apply.pending || code.trim() === ''}>
              Apply
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted">One code may be applied to each player account.</p>
        </form>
      )}
      <Feedback state={apply.state} />
    </Card>
  )
}

export function WalletTab() {
  const { state, actions } = useDemo()
  const balance = balanceOf(state.ledger, state.currentPlayerId)
  const entries = state.ledger
    .filter((e) => e.playerId === state.currentPlayerId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Play coins only. Coins are free, have no cash value, and can't be bought, sold or cashed out.
      </Notice>
      {ConnectWalletCard ? (
        <Suspense fallback={null}>
          <ConnectWalletCard />
        </Suspense>
      ) : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="p-2 sm:p-3">
          <div className="flex items-baseline justify-between px-3 pt-3 pb-2">
            <h3 className="text-lg">Transaction history</h3>
            <p className="text-sm text-muted">
              Balance <span className="font-semibold text-mint-600">{formatCoins(balance)}</span>
            </p>
          </div>
          <Transactions entries={entries} />
        </Card>
        <div className="space-y-4">
          <TopUpForm
            title="Get free coins"
            description={`Top up with free play coins: ${formatCoins(state.config.minTopUp)} to ${formatCoins(MAX_TOP_UP)} at a time.`}
            submitLabel="Add coins"
            presets={TOP_UP_PRESETS}
            min={state.config.minTopUp}
            max={MAX_TOP_UP}
            onSubmit={actions.addCoins}
          />
        </div>
      </div>
      <Referral />
      <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
        {confirmReset ? (
          <>
            <span className="text-muted">Reset all demo data to the starting state?</span>
            <Button size="sm" variant="danger" onClick={() => { actions.resetDemo(); setConfirmReset(false) }}>
              Yes, reset
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirmReset(true)}>
            <RotateCcw aria-hidden="true" className="size-4" /> Reset demo data
          </Button>
        )}
      </div>
    </div>
  )
}
