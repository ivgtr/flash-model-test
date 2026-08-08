import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RandomStringGeneratorTool } from './Tool'

const CHECKBOX_LABELS = ['Lowercase (a-z)', 'Uppercase (A-Z)', 'Digits (0-9)', 'Symbols']

async function setup() {
  const user = userEvent.setup()
  render(<RandomStringGeneratorTool />)
  return { user }
}

describe('RandomStringGeneratorTool', () => {
  it('generates and displays a string when Generate is clicked', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Generate' }))
    const output = await screen.findByTestId('random-string-output')
    expect(output.textContent).toHaveLength(16)
  })

  it('respects the requested length', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('Length'), { target: { value: '32' } })
    await user.click(screen.getByRole('button', { name: 'Generate' }))
    const output = await screen.findByTestId('random-string-output')
    expect(output.textContent).toHaveLength(32)
  })

  it('shows an error for an out-of-range length', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('Length'), { target: { value: '1025' } })
    await user.click(screen.getByRole('button', { name: 'Generate' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/between 1 and 1024/)
  })

  it('shows an error when no character set is selected', async () => {
    const { user } = await setup()
    for (const label of CHECKBOX_LABELS) {
      await user.click(screen.getByRole('checkbox', { name: label }))
    }
    await user.click(screen.getByRole('button', { name: 'Generate' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least one character set/)
  })

  it('generates a string from a single selected set', async () => {
    const { user } = await setup()
    for (const label of ['Lowercase (a-z)', 'Uppercase (A-Z)', 'Symbols']) {
      await user.click(screen.getByRole('checkbox', { name: label }))
    }
    await user.click(screen.getByRole('button', { name: 'Generate' }))
    const output = await screen.findByTestId('random-string-output')
    expect(output.textContent).toMatch(/^[0-9]+$/)
  })

  it('enables the Copy button after generating', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Generate' }))
    expect(await screen.findByRole('button', { name: 'Copy' })).toBeEnabled()
  })
})
