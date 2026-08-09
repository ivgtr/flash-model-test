import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DuplicateLineRemoverTool } from './Tool'

function setInput(value: string) {
  fireEvent.change(screen.getByLabelText('Text input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<DuplicateLineRemoverTool />)
  return { user }
}

describe('DuplicateLineRemoverTool', () => {
  it('removes duplicate lines from the input and shows the result', async () => {
    const { user } = await setup()
    setInput('apple\nbanana\napple\ncherry\nbanana')
    await user.click(screen.getByRole('button', { name: 'Remove duplicates' }))
    const output = await screen.findByTestId('dedup-output')
    expect(output).toHaveTextContent('apple\nbanana\ncherry', { normalizeWhitespace: false })
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('reflects option toggles in the result', async () => {
    const { user } = await setup()
    setInput('Apple\napple\nAPPLE')
    await user.click(screen.getByRole('checkbox', { name: 'Ignore case' }))
    await user.click(screen.getByRole('button', { name: 'Remove duplicates' }))
    const output = await screen.findByTestId('dedup-output')
    expect(output).toHaveTextContent('Apple')
  })

  it('applies trim and remove-blank-lines options together', async () => {
    const { user } = await setup()
    setInput('  abc  \n\nabc\n')
    await user.click(screen.getByRole('checkbox', { name: 'Trim whitespace before comparing' }))
    await user.click(screen.getByRole('checkbox', { name: 'Remove blank lines' }))
    await user.click(screen.getByRole('button', { name: 'Remove duplicates' }))
    const output = await screen.findByTestId('dedup-output')
    expect(output).toHaveTextContent('  abc  ', { normalizeWhitespace: false })
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Text input')
    setInput('a\na')
    await user.click(screen.getByRole('button', { name: 'Remove duplicates' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Deduplicated text will appear here/)).toBeInTheDocument()
  })
})
