import { Lock, LogOut, Wrench } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { BrandSlot } from '../components/layout/BrandSlot'
import { Button } from '../components/ui/Button'
import { EmptyState, Notice } from '../components/ui/Notice'
import { Badge, Card, Container } from '../components/ui/primitives'
import { TabList } from '../components/ui/Tabs'
import { pageTitle } from '../config/brand'
import { adminSummary, drawHistory, groupPrize, playerLabel, prizeBreakdown } from '../domain/rules'
import type { PlatformConfig } from '../domain/types'
import { formatDateTime, formatCoins, formatNumber, formatPercent } from '../lib/format'
import { tabPanelProps } from '../lib/tabs'
import { useAsyncAction } from '../lib/useAsyncAction'
import { usePageMeta } from '../lib/usePageMeta'
import { useDemo } from '../state/context'

/**
 * SECURITY NOTE
 * This page is gated on `state.role === 'admin'` and every admin action re-checks the role in the
 * mock server (DemoStore.updateConfig). That is a front-end demo only. Production needs:
 *  - server-side authentication (session/JWT) and an authorization check on EVERY admin API call,
 *  - the admin bundle served only to authenticated admins, audit logging, and MFA for admin accounts.
 * The dev-only role switch below is compiled out of production builds (import.meta.env.DEV).
 */
export function AdminPage() {
  const { state } = useDemo()
  usePageMeta({
    title: pageTitle(state.role === 'admin' ? 'Admin dashboard' : 'Restricted'),
    description: 'Administrator access is required.',
    noIndex: true,
  })
  return state.role === 'admin' ? <AdminDashboard /> : <AccessDenied />
}

function AccessDenied() {
  const { actions } = useDemo()
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-4 px-6">
      <span aria-hidden="true" className="inline-flex size-12 items-center justify-center rounded-2xl bg-lilac-50 text-lilac-600">
        <Lock className="size-6" />
      </span>
      <h1 className="text-3xl">Administrator access required</h1>
      <p className="text-muted">You don't have permission to view this page. If you're an administrator, sign in with your admin account.</p>
      <Link to="/dashboard" className="font-medium text-violet underline underline-offset-4">
        Go to dashboard
      </Link>
      {import.meta.env.DEV ? (
        <div className="mt-6 w-full rounded-xl border border-dashed border-amber-600/40 bg-amber-50/60 p-4 text-sm">
          <p className="font-medium text-amber-600">Development build only</p>
          <p className="mt-1 text-muted">
            There is no backend yet, so admin sign-in can't be real. This switch lets developers preview the admin UI and is removed
            from production builds.
          </p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => actions.setRole('admin')}>
            Preview as admin (dev only)
          </Button>
        </div>
      ) : null}
    </main>
  )
}

type AdminTab = 'config' | 'draws' | 'users'

function AdminDashboard() {
  const { state, actions } = useDemo()
  const summary = adminSummary(state)
  const [tab, setTab] = useState<AdminTab>('config')

  const stats = [
    { label: 'Fees collected', value: formatCoins(summary.totalRevenue), hint: 'Play coins from settled draws' },
    { label: 'Total draws', value: formatNumber(summary.totalDraws), hint: 'Settled' },
    { label: 'Total players', value: formatNumber(summary.totalPlayers), hint: 'Seen in any group' },
    { label: 'Active groups', value: formatNumber(summary.activeGroups), hint: 'Open, picking or revealing' },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 shadow-header backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandSlot />
            <Badge tone="pink">Admin</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="rounded-xl px-3 py-2 text-sm font-medium text-violet hover:bg-lilac-50">
              Back to dashboard
            </Link>
            <Button size="sm" variant="ghost" onClick={() => actions.setRole('guest')}>
              <LogOut aria-hidden="true" className="size-4" /> Exit admin
            </Button>
          </div>
        </Container>
      </header>
      <main id="main">
        <Container className="space-y-6 py-8">
          <div>
            <h1 className="text-3xl">Admin dashboard</h1>
            <p className="text-muted">Manage configuration, monitor revenue, and view player activity.</p>
          </div>
          <Notice tone="info">
            Demo data. In production these controls must call authenticated, authorised server endpoints — this screen alone is not
            protection.
          </Notice>
          <section aria-label="Platform summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} className="p-4 sm:p-5">
                <h2 className="font-sans text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{s.label}</h2>
                <p className="mt-1 font-display text-2xl font-semibold text-heading sm:text-3xl">{s.value}</p>
                <p className="text-xs text-muted">{s.hint}</p>
              </Card>
            ))}
          </section>
          <TabList
            items={[
              { key: 'config', label: 'Platform Config' },
              { key: 'draws', label: 'Recent Draws' },
              { key: 'users', label: 'Users' },
            ]}
            active={tab}
            onChange={setTab}
            idBase="admin"
            label="Admin sections"
          />
          <div {...tabPanelProps('admin', tab)} className="outline-none">
            {tab === 'config' ? <ConfigPanel /> : tab === 'draws' ? <DrawsPanel /> : <UsersPanel />}
          </div>
        </Container>
      </main>
    </>
  )
}

function ConfigRow({
  label,
  current,
  hint,
  field,
  suffix,
}: {
  label: string
  current: string
  hint: string
  field: 'platformFeePct' | 'minTopUp'
  suffix: string
}) {
  const { actions } = useDemo()
  const id = useId()
  const [value, setValue] = useState('')
  const act = useAsyncAction()

  async function submit(e: FormEvent) {
    e.preventDefault()
    const n = Number(value.replace(/[,\s%]/g, ''))
    const patch: Partial<PlatformConfig> = { [field]: value.trim() === '' ? Number.NaN : n }
    const r = await act.run(() => actions.updateConfig(patch), `${label} updated.`)
    if (r.ok) setValue('')
  }

  return (
    <Card className="p-5">
      <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label htmlFor={id} className="font-medium text-heading">
            {label}
          </label>
          <p className="text-sm text-muted">
            Current: <span className="font-semibold text-heading">{current}</span> · {hint}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <input
              id={id}
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="New value"
              className="h-10 w-40 rounded-xl border border-line bg-white px-3 pr-14 text-sm outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
            />
            <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">
              {suffix}
            </span>
          </div>
          <Button type="submit" size="sm" disabled={act.pending || value.trim() === ''}>
            Update
          </Button>
        </div>
      </form>
      {act.state.status === 'error' ? <Notice tone="error" className="mt-3">{act.state.message}</Notice> : null}
      {act.state.status === 'success' ? <Notice tone="success" className="mt-3">{act.state.message}</Notice> : null}
    </Card>
  )
}

function ConfigPanel() {
  const { state, actions } = useDemo()
  const [confirming, setConfirming] = useState(false)
  const act = useAsyncAction()
  const on = state.config.maintenance

  return (
    <div className="space-y-3">
      <ConfigRow
        label="Platform fee"
        field="platformFeePct"
        suffix="%"
        current={formatPercent(state.config.platformFeePct)}
        hint="Applies to new groups only; existing groups keep their fee"
      />
      <ConfigRow label="Minimum top-up" field="minTopUp" suffix="coins" current={formatCoins(state.config.minTopUp)} hint="Per free top-up" />
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-sans text-base font-medium text-heading">
              <Wrench aria-hidden="true" className="size-4" /> Maintenance mode
            </h3>
            <p className="text-sm text-muted">
              Status: <Badge tone={on ? 'pink' : 'mint'}>{on ? 'Enabled' : 'Disabled'}</Badge> · pauses joins and top-ups
            </p>
          </div>
          {confirming ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={on ? 'primary' : 'danger'}
                disabled={act.pending}
                onClick={() =>
                  void act.run(() => actions.updateConfig({ maintenance: !on }), on ? 'Maintenance disabled.' : 'Maintenance enabled.').then(() =>
                    setConfirming(false),
                  )
                }
              >
                Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant={on ? 'primary' : 'danger'} onClick={() => setConfirming(true)}>
              {on ? 'Disable maintenance' : 'Enable maintenance'}
            </Button>
          )}
        </div>
        {act.state.status === 'error' ? <Notice tone="error" className="mt-3">{act.state.message}</Notice> : null}
        {act.state.status === 'success' ? <Notice tone="success" className="mt-3">{act.state.message}</Notice> : null}
      </Card>
    </div>
  )
}

function DrawsPanel() {
  const { state } = useDemo()
  const draws = drawHistory(state.groups)
  if (draws.length === 0) return <EmptyState icon={<Wrench className="size-6" />} title="No draws yet" body="Settled draws appear here." />
  return (
    <Card className="overflow-x-auto p-2 sm:p-3" tabIndex={0} role="region" aria-label="Scrollable table">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left text-xs tracking-wider text-muted uppercase">
            {['Draw', 'Settled', 'Winner', 'Collected', 'Fee', 'Prize'].map((h) => (
              <th key={h} scope="col" className="px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {draws.map((g) => {
            const b = prizeBreakdown(g.entryFee, g.size, g.feePct)
            return (
              <tr key={g.id}>
                <th scope="row" className="px-3 py-3 text-left font-medium text-heading">
                  #{g.number} · {g.size}P
                </th>
                <td className="px-3 py-3 text-muted">{g.settledAt ? formatDateTime(g.settledAt) : '—'}</td>
                <td className="px-3 py-3">{playerLabel(state, g.winnerId)}</td>
                <td className="px-3 py-3 tabular-nums">{formatCoins(b.grossPool)}</td>
                <td className="px-3 py-3 tabular-nums">{formatCoins(b.platformFee)}</td>
                <td className="px-3 py-3 font-semibold text-mint-600 tabular-nums">{formatCoins(groupPrize(g))}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}

function UsersPanel() {
  const { state } = useDemo()
  const rows = Object.values(state.players)
    .map((p) => {
      const played = state.groups.filter((g) => g.playerIds.includes(p.id))
      return {
        player: p,
        games: played.length,
        wins: played.filter((g) => g.status === 'settled' && g.winnerId === p.id).length,
      }
    })
    .sort((a, b) => b.games - a.games || a.player.label.localeCompare(b.player.label))

  return (
    <Card className="overflow-x-auto p-2 sm:p-3" tabIndex={0} role="region" aria-label="Scrollable table">
      <table className="w-full min-w-[420px] text-sm">
        <caption className="px-3 pt-2 pb-2 text-left text-muted">{formatNumber(rows.length)} players</caption>
        <thead>
          <tr className="text-left text-xs tracking-wider text-muted uppercase">
            <th scope="col" className="px-3 py-2 font-semibold">Player</th>
            <th scope="col" className="px-3 py-2 font-semibold">Type</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Games</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Wins</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {rows.map((r) => (
            <tr key={r.player.id}>
              <th scope="row" className="px-3 py-2.5 text-left font-medium text-heading">
                {r.player.label}
              </th>
              <td className="px-3 py-2.5 text-muted">{r.player.isBot ? 'Simulated' : 'Player'}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{r.games}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{r.wins}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
