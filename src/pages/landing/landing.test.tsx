import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { routes } from '../../app/routes'

describe('landing page', () => {
  it('renders all sections with corrected live figures', async () => {
    render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/'] })} />)
    const card = await screen.findByRole('region', { name: /live groups/i })
    expect(within(card).getByText('4')).toBeInTheDocument()
    // 1,76,000 + 1,76,000 + 3,96,000 + 8,80,000 — fee-adjusted (reference showed ₹18,50,000)
    expect(within(card).getByText('₹16,28,000')).toBeInTheDocument()
    expect(within(card).getByText('5–20')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /a happy little ritual/i })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(9)
    expect(screen.getByRole('heading', { name: /your next group is waiting/i })).toBeInTheDocument()
    expect(screen.getByText(/must be 18\+/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /play now/i })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: /see the simple steps/i })).toHaveAttribute('href', '#how-it-works')
  })

  it('does not invent a brand: the home link is an unlabelled slot', async () => {
    render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/'] })} />)
    const slots = await screen.findAllByRole('link', { name: 'Home' })
    expect(slots[0]).toHaveAttribute('data-brand-slot', 'empty')
    expect(slots[0]).toBeEmptyDOMElement()
  })
})
