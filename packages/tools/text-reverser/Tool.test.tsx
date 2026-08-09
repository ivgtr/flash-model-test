import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TextReverserTool } from './Tool'

function setInput(value: string) {
  fireEvent.change(screen.getByLabelText('Text to reverse'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<TextReverserTool />)
  return { user }
}

describe('TextReverserTool', () => {
  it('reverses user input character by character by default', async () => {
    const { user } = await setup()
    setInput('Hello, world!')
    await user.click(screen.getByRole('button', { name: 'Reverse' }))
    const output = await screen.findByTestId('reverser-output')
    expect(output).toHaveTextContent('!dlrow ,olleH')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('keeps emoji intact when reversing user input', async () => {
    const { user } = await setup()
    setInput('ab👍cd')
    await user.click(screen.getByRole('button', { name: 'Reverse' }))
    const output = await screen.findByTestId('reverser-output')
    expect(output).toHaveTextContent('dc👍ba')
  })

  it('reflects the selected mode in the reversed result', async () => {
    const { user } = await setup()
    setInput('one two three')
    await user.selectOptions(screen.getByLabelText('Mode'), 'words')
    await user.click(screen.getByRole('button', { name: 'Reverse' }))
    expect(await screen.findByTestId('reverser-output')).toHaveTextContent('three two one')
  })

  it('reflects line mode including empty lines and newlines', async () => {
    const { user } = await setup()
    setInput('first\n\nsecond')
    await user.selectOptions(screen.getByLabelText('Mode'), 'lines')
    await user.click(screen.getByRole('button', { name: 'Reverse' }))
    const output = await screen.findByTestId('reverser-output')
    expect(output).toHaveTextContent('second\n\nfirst', { normalizeWhitespace: false })
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Text to reverse')
    setInput('Hello')
    await user.click(screen.getByRole('button', { name: 'Reverse' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Reversed text will appear here/)).toBeInTheDocument()
  })
})
