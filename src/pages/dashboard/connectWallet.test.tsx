import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { routes } from '../../app/routes'

async function openDialog() {
  const user = userEvent.setup()
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/dashboard?tab=wallet'] })} />)
  await user.click(await screen.findByRole('button', { name: /^connect$/i }))
  return { user, dialog: screen.getByRole('dialog', { name: /connect a bank account/i }) }
}

describe('connect wallet prototype', () => {
  it('walks through bank details with validation and never claims success', async () => {
    const { user, dialog } = await openDialog()
    expect(within(dialog).getByText(/step 1 of 4/i)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /continue/i }))

    // Submitting empty shows field errors
    await user.click(within(dialog).getByRole('button', { name: /review details/i }))
    expect(within(dialog).getByLabelText(/account holder name/i)).toHaveAttribute('aria-invalid', 'true')
    await waitFor(() => expect(within(dialog).getByLabelText(/account holder name/i)).toHaveFocus())
    expect(within(dialog).getByText(/9 to 18 digits/i)).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText(/account holder name/i), 'Prince Panwar')
    await user.type(within(dialog).getByLabelText(/^account number$/i), '123456789012')
    await user.type(within(dialog).getByLabelText(/re-enter account number/i), '123456789012')
    await user.type(within(dialog).getByLabelText(/ifsc code/i), 'hdfc0001234')
    expect(within(dialog).getByLabelText(/ifsc code/i)).toHaveValue('HDFC0001234')
    await user.click(within(dialog).getByRole('button', { name: /review details/i }))

    // Review shows only the masked number
    expect(within(dialog).getByText('XXXXXXXX9012')).toBeInTheDocument()
    expect(within(dialog).queryByText('123456789012')).not.toBeInTheDocument()
    const connect = within(dialog).getByRole('button', { name: /connect account/i })
    expect(connect).toBeDisabled()
    await user.click(within(dialog).getByLabelText(/in my own name/i))
    await user.click(connect)

    expect(within(dialog).getByRole('heading', { name: /bank linking is switched off/i })).toBeInTheDocument()
    expect(within(dialog).getByText(/was not connected/i)).toBeInTheDocument()

    // Nothing about the account reached storage
    const stored = JSON.stringify({ ...window.localStorage })
    expect(stored).not.toContain('123456789012')
    expect(stored).not.toContain('HDFC0001234')
  })

  it('supports UPI and validates the ID', async () => {
    const { user, dialog } = await openDialog()
    await user.click(within(dialog).getByRole('radio', { name: /upi id/i }))
    await user.click(within(dialog).getByRole('button', { name: /continue/i }))
    await user.type(within(dialog).getByLabelText(/upi id/i), 'prince@')
    await user.click(within(dialog).getByRole('button', { name: /review details/i }))
    expect(within(dialog).getByText(/look like name@bank/i)).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText(/upi id/i), 'okhdfcbank')
    await user.click(within(dialog).getByRole('button', { name: /review details/i }))
    expect(within(dialog).getByText('prince@okhdfcbank')).toBeInTheDocument()
  })

  it('closes on Escape, clears entered details and returns focus to the opener', async () => {
    const { user, dialog } = await openDialog()
    await user.click(within(dialog).getByRole('button', { name: /continue/i }))
    await user.type(within(dialog).getByLabelText(/account holder name/i), 'Prince')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^connect$/i })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: /^connect$/i }))
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByLabelText(/account holder name/i)).toHaveValue('')
  })
})
