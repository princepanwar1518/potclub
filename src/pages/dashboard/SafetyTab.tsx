import { Lock, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import { Notice } from '../../components/ui/Notice'
import { Card } from '../../components/ui/primitives'
import { LIMIT_COOLING_OFF_HOURS } from '../../domain/rules'
import type { PlayLimits, Result } from '../../domain/types'
import { formatDateTime, formatCoins } from '../../lib/format'
import { useAsyncAction } from '../../lib/useAsyncAction'
import { useDemo, useNow } from '../../state/context'

const LIMIT_FIELDS: { key: keyof PlayLimits; label: string; hint: string }[] = [
  { key: 'hourlySpend', label: 'Hourly spend limit (coins)', hint: 'Total entry fees in any 60 minutes' },
  { key: 'dailySpend', label: 'Daily spend limit (coins)', hint: 'Total entry fees in any 24 hours' },
  { key: 'dailyLoss', label: 'Daily loss limit (coins)', hint: 'Entries minus prizes in any 24 hours' },
]

const TIMEOUTS = [
  { label: '24 hours', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days', hours: 168 },
] as const

const EXCLUSIONS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '6 months', days: 182 },
] as const

function LimitsForm() {
  const { state, actions } = useDemo()
  const baseId = useId()
  const [values, setValues] = useState<Record<keyof PlayLimits, string>>(() => ({
    hourlySpend: state.safety.limits.hourlySpend?.toString() ?? '',
    dailySpend: state.safety.limits.dailySpend?.toString() ?? '',
    dailyLoss: state.safety.limits.dailyLoss?.toString() ?? '',
  }))
  const save = useAsyncAction()

  function submit(e: FormEvent) {
    e.preventDefault()
    const parse = (v: string): number | null => {
      const t = v.replace(/[,\s]/g, '')
      if (t === '') return null
      return /^\d+$/.test(t) ? Number(t) : Number.NaN
    }
    const limits: PlayLimits = {
      hourlySpend: parse(values.hourlySpend),
      dailySpend: parse(values.dailySpend),
      dailyLoss: parse(values.dailyLoss),
    }
    void save.run(
      () => actions.saveLimits(limits),
      'Saved. Lower limits apply immediately; raised or removed limits wait out the cooling-off period.',
    )
  }

  return (
    <Card className="p-5 sm:p-6">
      <h3 className="flex items-center gap-2 text-lg">
        <ShieldCheck aria-hidden="true" className="size-5 text-mint-600" /> Spending limits
      </h3>
      <p className="mt-1 text-sm text-muted">
        Limits are checked before every paid entry. Leave a field empty for no limit. Lowering a limit takes effect at once;
        raising or removing one takes effect after {LIMIT_COOLING_OFF_HOURS} hours.
      </p>
      <PendingNotice />
      <form onSubmit={submit} noValidate className="mt-4 grid gap-4 sm:grid-cols-3">
        {LIMIT_FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={`${baseId}-${f.key}`} className="text-sm font-medium text-heading">
              {f.label}
            </label>
            <input
              id={`${baseId}-${f.key}`}
              inputMode="numeric"
              placeholder="No limit"
              aria-describedby={`${baseId}-${f.key}-hint`}
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="mt-1.5 h-11 w-full rounded-btn border-2 border-ink bg-surface-2 px-3 text-base outline-none focus:border-ink focus:ring-4 focus:ring-accent/40"
            />
            <p id={`${baseId}-${f.key}-hint`} className="mt-1 text-xs text-muted">
              {f.hint}
              {state.safety.limits[f.key] !== null ? ` · current ${formatCoins(state.safety.limits[f.key] ?? 0)}` : ''}
            </p>
          </div>
        ))}
        <div className="sm:col-span-3">
          <Button type="submit" disabled={save.pending}>
            {save.pending ? 'Saving…' : 'Save limits'}
          </Button>
        </div>
      </form>
      {save.state.status === 'error' ? <Notice tone="error" className="mt-3">{save.state.message}</Notice> : null}
      {save.state.status === 'success' ? <Notice tone="success" className="mt-3">{save.state.message}</Notice> : null}
    </Card>
  )
}

function PendingNotice() {
  const { state } = useDemo()
  const now = useNow()
  const p = state.safety.pendingLimits
  if (!p || Date.parse(p.effectiveAt) <= now) return null
  const names: Record<keyof PlayLimits, string> = { hourlySpend: 'Hourly spend', dailySpend: 'Daily spend', dailyLoss: 'Daily loss' }
  const parts = (Object.keys(p.changes) as (keyof PlayLimits)[]).map((k) => {
    const v = p.changes[k]
    return `${names[k]} → ${v === null || v === undefined ? 'no limit' : formatCoins(v)}`
  })
  return (
    <Notice tone="info" className="mt-3">
      Pending: {parts.join(', ')} from <strong>{formatDateTime(p.effectiveAt)}</strong>. Until then your current limits still apply.
    </Notice>
  )
}

/** Two-step confirm (no browser dialogs): choose a period, then confirm it explicitly. */
function BlockCard({
  title,
  description,
  icon,
  options,
  activeUntil,
  confirmVerb,
  onConfirm,
}: {
  title: string
  description: string
  icon: ReactNode
  options: readonly { label: string; value: number }[]
  activeUntil: string | null
  confirmVerb: string
  onConfirm: (value: number) => Promise<Result>
}) {
  const now = useNow()
  const [chosen, setChosen] = useState<{ label: string; value: number } | null>(null)
  const act = useAsyncAction()
  const active = activeUntil !== null && Date.parse(activeUntil) > now

  return (
    <Card className="p-5 sm:p-6">
      <h3 className="flex items-center gap-2 text-lg">
        {icon} {title}
      </h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
      {active && activeUntil ? (
        <Notice tone="info" className="mt-4">
          Active until <strong>{formatDateTime(activeUntil)}</strong>. It can't be shortened or cancelled.
        </Notice>
      ) : chosen ? (
        <div className="mt-4 rounded-btn border border-danger/20 bg-pink-50/60 p-4">
          <p className="text-sm text-heading">
            {confirmVerb} for <strong>{chosen.label}</strong>? You won't be able to join paid groups until it ends, and it can't be
            undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="danger"
              disabled={act.pending}
              onClick={() => void act.run(() => onConfirm(chosen.value), `${title} started.`).then(() => setChosen(null))}
            >
              Confirm {chosen.label}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setChosen(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {options.map((o) => (
            <Button key={o.label} size="sm" variant="secondary" onClick={() => setChosen(o)}>
              {o.label}
            </Button>
          ))}
        </div>
      )}
      {act.state.status === 'error' ? <Notice tone="error" className="mt-3">{act.state.message}</Notice> : null}
    </Card>
  )
}

export function SafetyTab() {
  const { state, actions } = useDemo()
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl">Play safely</h3>
        <p className="text-sm text-muted">Set limits that are checked before you join a paid group.</p>
      </div>
      <LimitsForm />
      <div className="grid gap-4 md:grid-cols-2">
        <BlockCard
          title="Take a time-out"
          description="Temporarily block paid group entries."
          icon={<Lock aria-hidden="true" className="size-5 text-amber-600" />}
          options={TIMEOUTS.map((t) => ({ label: t.label, value: t.hours }))}
          activeUntil={state.safety.timeoutUntil}
          confirmVerb="Start a time-out"
          onConfirm={actions.takeTimeout}
        />
        <BlockCard
          title="Self-exclude"
          description="Block all paid group entries for the selected period."
          icon={<ShieldAlert aria-hidden="true" className="size-5 text-danger" />}
          options={EXCLUSIONS.map((x) => ({ label: x.label, value: x.days }))}
          activeUntil={state.safety.selfExcludedUntil}
          confirmVerb="Self-exclude"
          onConfirm={actions.selfExclude}
        />
      </div>
      <p className="text-xs text-muted">
        If gambling stops being fun, talk to someone you trust or a professional support service. You must be 18+ to take part.
      </p>
    </div>
  )
}
