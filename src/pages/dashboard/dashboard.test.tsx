import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { routes } from '../../app/routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

async function stat(label: RegExp) {
  const stats = await screen.findByRole('region', { name: /your stats/i })
  const heading = within(stats).getByRole('heading', { name: label })
  return heading.parentElement as HTMLElement
}

describe('dashboard', () => {
  it('shows stats derived from the ledger (defect 3)', async () => {
    renderAt('/dashboard')
    expect(within(await stat(/balance/i)).getByText('9,900')).toBeInTheDocument()
    expect(within(await stat(/^games$/i)).getByText('3')).toBeInTheDocument()
    expect(within(await stat(/^wins$/i)).getByText('0')).toBeInTheDocument()
  })

  it('shows fee-adjusted prize pools and disables unaffordable joins (defects 2 & 4)', async () => {
    renderAt('/dashboard')
    const card = (await screen.findByRole('heading', { name: /10-player group #1002/i })).closest('div.rounded-card') as HTMLElement
    expect(within(card).getByText('1,76,000')).toBeInTheDocument()
    expect(within(card).getByText(/2,00,000 collected − 24,000 \(12% fee\)/)).toBeInTheDocument()
    const join = within(card).getByRole('button', { name: /join group/i })
    expect(join).toBeDisabled()
    expect(join).toHaveAccessibleDescription(/not enough coins — you need 10,100 coins more to join/i)
    // Already-joined group shows a waiting state instead of a join button
    const mine = (await screen.findByRole('heading', { name: /10-player group #1001/i })).closest('div.rounded-card') as HTMLElement
    expect(within(mine).getByRole('button', { name: /waiting for players/i })).toBeDisabled()
  })

  it('quick play joins a 5-player group and uses 100 coins', async () => {
    const user = userEvent.setup()
    renderAt('/dashboard')
    await user.click(await screen.findByRole('button', { name: /^5P/ }))
    expect(await screen.findByText(/you're in a 5-player group/i)).toBeInTheDocument()
    expect(within(await stat(/balance/i)).getByText('9,800')).toBeInTheDocument()
    expect(within(await stat(/^games$/i)).getByText('4')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /your groups/i })).toBeInTheDocument()
  })

  it('lists draw history newest first and the leaderboard from real wins (defects 5 & 6)', async () => {
    const user = userEvent.setup()
    renderAt('/dashboard?tab=history')
    const items = await screen.findAllByText(/-Player Draw #/)
    expect(items.map((el) => el.textContent?.match(/#(\d+)/)?.[1])).toEqual(['152', '151', '150', '27', '12'])

    await user.click(screen.getByRole('tab', { name: /leaderboard/i }))
    const rows = within(await screen.findByRole('table')).getAllByRole('row').slice(1)
    expect(rows.map((r) => within(r).getAllByRole('cell').map((c) => c.textContent))).toEqual([
      ['#1', '2', '88,000 coins'],
      ['#2', '2', '880 coins'],
      ['#3', '1', '440 coins'],
    ])
  })

  it('supports arrow-key tab navigation and syncs the URL', async () => {
    const user = userEvent.setup()
    const router = renderAt('/dashboard')
    const first = await screen.findByRole('tab', { name: /available groups/i })
    first.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: /draw history/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /draw history/i })).toHaveFocus()
    expect(router.state.location.search).toBe('?tab=history')
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: /alerts/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('validates free top-ups against the 200-coin minimum and records valid ones', async () => {
    const user = userEvent.setup()
    renderAt('/dashboard?tab=wallet')
    const inputs = await screen.findAllByRole('textbox', { name: /amount/i })
    const depositForm = inputs[0]!.closest('form') as HTMLElement
    await user.type(within(depositForm).getByRole('textbox'), '150')
    await user.click(within(depositForm).getByRole('button', { name: /^add coins$/i }))
    expect(await screen.findByText(/the minimum top-up is 200 coins/i)).toBeInTheDocument()

    await user.clear(within(depositForm).getByRole('textbox'))
    await user.click(within(depositForm).getByRole('button', { name: '5,000' }))
    await user.click(within(depositForm).getByRole('button', { name: /^add coins$/i }))
    expect(await screen.findByText(/5,000 coins added to your balance/i)).toBeInTheDocument()
    expect(within(await stat(/balance/i)).getByText('14,900')).toBeInTheDocument()
  })

  it('enforces safety limits on joins and rejects inconsistent limits', async () => {
    const user = userEvent.setup()
    renderAt('/dashboard?tab=safety')
    await user.type(await screen.findByLabelText(/hourly spend limit/i), '500')
    await user.type(screen.getByLabelText(/daily spend limit/i), '400')
    await user.click(screen.getByRole('button', { name: /save limits/i }))
    expect(await screen.findByText(/hourly limit cannot be higher than your daily limit/i)).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/hourly spend limit/i))
    await user.clear(screen.getByLabelText(/daily spend limit/i))
    await user.type(screen.getByLabelText(/daily spend limit/i), '50')
    await user.click(screen.getByRole('button', { name: /save limits/i }))
    expect(await screen.findByText(/lower limits apply immediately/i)).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /available groups/i }))
    await user.click(await screen.findByRole('button', { name: /^5P/ }))
    expect(await screen.findByText(/would exceed your daily spend limit/i)).toBeInTheDocument()
  })

  it('requires an explicit confirmation before a time-out', async () => {
    const user = userEvent.setup()
    renderAt('/dashboard?tab=safety')
    await user.click(await screen.findByRole('button', { name: '24 hours' }))
    expect(screen.getByText(/can't be undone/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /confirm 24 hours/i }))
    expect(await screen.findByText(/active until/i)).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /available groups/i }))
    await user.click(await screen.findByRole('button', { name: /^5P/ }))
    // Shown in the quick-play error and on every group card's disabled join reason
    expect((await screen.findAllByText(/time-out from joining groups/i)).length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('alert')).toHaveTextContent(/time-out from joining groups/i)
  })

  it('does not show an admin link to guests', async () => {
    renderAt('/dashboard')
    await screen.findByRole('region', { name: /your stats/i })
    expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument()
  })
})

describe('admin', () => {
  it('guards the route; the dev preview exposes config and rejects invalid values', async () => {
    const user = userEvent.setup()
    renderAt('/admin')
    expect(await screen.findByRole('heading', { name: /administrator access required/i })).toBeInTheDocument()
    expect(screen.queryByText(/maintenance mode/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /preview as admin \(dev only\)/i }))
    const summary = await screen.findByRole('region', { name: /platform summary/i })
    expect(within(summary).getByText('12,180 coins')).toBeInTheDocument()
    expect(within(summary).getByText('5')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/platform fee/i), '45')
    await user.click(within(screen.getByLabelText(/platform fee/i).closest('form') as HTMLElement).getByRole('button', { name: /update/i }))
    expect(await screen.findByText(/between 0% and 30%/i)).toBeInTheDocument()

    expect(screen.getByText('200 coins')).toBeInTheDocument() // en-IN grouping, coins not currency
    expect(screen.queryByText(/withdrawal/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /enable maintenance/i }))
    await user.click(screen.getByRole('button', { name: /^confirm$/i }))
    expect(await screen.findByText(/maintenance enabled/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /exit admin/i }))
    expect(await screen.findByRole('heading', { name: /administrator access required/i })).toBeInTheDocument()
  })
})

describe('audit regressions', () => {
  it('blocks coin top-ups during a time-out (A-4)', async () => {
    const user = userEvent.setup()
    renderAt('/dashboard?tab=safety')
    const timeoutCard = (await screen.findByRole('heading', { name: /take a time-out/i })).closest('div.rounded-card') as HTMLElement
    await user.click(within(timeoutCard).getByRole('button', { name: '7 days' }))
    await user.click(within(timeoutCard).getByRole('button', { name: /confirm 7 days/i }))
    expect(await screen.findByText(/active until/i)).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /wallet/i }))
    const depositForm = (await screen.findAllByRole('textbox', { name: /amount/i }))[0]!.closest('form') as HTMLElement
    await user.type(within(depositForm).getByRole('textbox'), '500')
    await user.click(within(depositForm).getByRole('button', { name: /^add coins$/i }))
    expect(await screen.findByText(/top-ups are paused until it ends/i)).toBeInTheDocument()
    expect(within(await stat(/balance/i)).getByText('9,900')).toBeInTheDocument()
  })

  it('shows a pending notice when a limit is raised (A-5)', async () => {
    const user = userEvent.setup()
    renderAt('/dashboard?tab=safety')
    const daily = await screen.findByLabelText(/daily spend limit/i)
    await user.type(daily, '1000')
    await user.click(screen.getByRole('button', { name: /save limits/i }))
    expect(await screen.findByText(/lower limits apply immediately/i)).toBeInTheDocument()
    await user.clear(daily)
    await user.type(daily, '90000')
    await user.click(screen.getByRole('button', { name: /save limits/i }))
    expect(await screen.findByText(/pending: daily spend → 90,000 coins/i)).toBeInTheDocument()
    expect(screen.getByText(/current 1,000 coins/i)).toBeInTheDocument()
  })

  it('rejects an admin minimum top-up above the top-up cap (A-6)', async () => {
    const user = userEvent.setup()
    renderAt('/admin')
    await user.click(await screen.findByRole('button', { name: /preview as admin \(dev only\)/i }))
    const input = await screen.findByLabelText(/minimum top-up/i)
    await user.type(input, '200000')
    await user.click(within(input.closest('form') as HTMLElement).getByRole('button', { name: /update/i }))
    expect(await screen.findByText(/cannot exceed the 1,00,000 coins top-up cap/i)).toBeInTheDocument()
  })
})
