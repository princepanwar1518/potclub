import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { routes } from '../app/routes'

describe('privacy page', () => {
  it('is routed and states the on-device, no-tracking data practice the stores ask about', async () => {
    render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/privacy'] })} />)
    expect(await screen.findByRole('heading', { level: 1, name: /privacy policy/i })).toBeInTheDocument()
    expect(screen.getByText(/never leaves your device/i)).toBeInTheDocument()
    expect(screen.getByText(/no advertising, analytics, tracking/i)).toBeInTheDocument()
    expect(document.title).toBe('Privacy policy · PotClub')
  })

  it('is linked from the site footer', async () => {
    render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/'] })} />)
    expect(await screen.findByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
  })
})
