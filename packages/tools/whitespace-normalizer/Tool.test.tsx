import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { WhitespaceNormalizerTool } from './Tool'

function setInput(value: string) {
  fireEvent.change(screen.getByLabelText('Text input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<WhitespaceNormalizerTool />)
  return { user }
}

describe('WhitespaceNormalizerTool', () => {
  it('normalizes user input with every option enabled by default', async () => {
    const { user } = await setup()
    setInput('  Hello   World  \r\n\r\nSecond\tLine  ')
    await user.click(screen.getByRole('button', { name: 'Normalize' }))
    const output = await screen.findByTestId('normalized-output')
    expect(output).toHaveTextContent(['Hello World', 'Second Line'].join('\n'), {
      normalizeWhitespace: false,
    })
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('reflects option toggles in the normalized result', async () => {
    const { user } = await setup()
    await user.click(screen.getByLabelText('Trim leading and trailing whitespace on each line'))
    await user.click(screen.getByLabelText('Collapse runs of spaces and tabs to a single space'))
    await user.click(screen.getByLabelText('Convert CRLF / CR line endings to LF'))
    await user.click(screen.getByLabelText('Remove blank lines (including whitespace-only lines)'))
    setInput('  a  b  \n\n  c  ')
    await user.click(screen.getByRole('button', { name: 'Normalize' }))
    const output = await screen.findByTestId('normalized-output')
    expect(output).toHaveTextContent(['  a  b', '', '  c'].join('\n'), {
      normalizeWhitespace: false,
    })
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Text input')
    setInput('  a  \nb')
    await user.click(screen.getByRole('button', { name: 'Normalize' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Normalized text will appear here/)).toBeInTheDocument()
  })
})
