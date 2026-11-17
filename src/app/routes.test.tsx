import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { routes } from './routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
}

describe('routes', () => {
  it('renders the landing page with SEO metadata', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: /pick a number/i })).toBeInTheDocument()
    expect(document.title).toMatch(/pick a number/i)
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBeTruthy()
  })

  it('renders the dashboard as a non-indexed page', async () => {
    renderAt('/dashboard')
    expect(await screen.findByRole('heading', { level: 1, name: /dashboard/i })).toBeInTheDocument()
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow')
  })

  it('never shows admin settings or maintenance controls to a guest', async () => {
    renderAt('/admin')
    expect(await screen.findByRole('heading', { name: /administrator access required/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /maintenance/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/platform fee/i)).not.toBeInTheDocument()
  })

  it('renders a 404 page for unknown paths', async () => {
    renderAt('/does-not-exist')
    expect(await screen.findByRole('heading', { name: /couldn't find that page/i })).toBeInTheDocument()
  })
})
