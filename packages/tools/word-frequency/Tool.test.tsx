import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { WordFrequencyTool } from './Tool'

function setInput(value: string) {
  fireEvent.change(screen.getByLabelText('Word frequency input'), { target: { value } })
}

function output() {
  return screen.getByTestId('word-frequency-output')
}

async function setup() {
  const user = userEvent.setup()
  render(<WordFrequencyTool />)
  return { user }
}

describe('WordFrequencyTool', () => {
  it('shows a frequency table for entered text', async () => {
    const { user } = await setup()
    setInput('the cat and the dog')
    await user.click(screen.getByRole('button', { name: 'Count' }))
    const table = await screen.findByTestId('word-frequency-output')
    expect(table).toHaveTextContent('Total words: 5 · Unique words: 4')
    expect(table).toHaveTextContent('the')
    expect(table).toHaveTextContent('cat')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('reflects the ignore-case option in the result', async () => {
    const { user } = await setup()
    setInput('The the THE')
    await user.click(screen.getByRole('button', { name: 'Count' }))
    expect(await screen.findByTestId('word-frequency-totals')).toHaveTextContent('Unique words: 3')

    await user.click(screen.getByRole('checkbox', { name: /Ignore case/ }))
    await user.click(screen.getByRole('button', { name: 'Count' }))
    expect(screen.getByTestId('word-frequency-totals')).toHaveTextContent('Unique words: 1')
    expect(output()).toHaveTextContent('The')
    expect(output().querySelectorAll('tbody tr')).toHaveLength(1)
  })

  it('reflects the top-N limit option in the result', async () => {
    const { user } = await setup()
    setInput('a a b b c c d d e e f f g g h h i i j j k k l l')
    await user.selectOptions(screen.getByLabelText('Show top'), '10')
    await user.click(screen.getByRole('button', { name: 'Count' }))
    expect(await screen.findByTestId('word-frequency-output')).toHaveTextContent('Total words: 24')
    expect(output().querySelectorAll('tbody tr')).toHaveLength(10)

    await user.selectOptions(screen.getByLabelText('Show top'), 'all')
    await user.click(screen.getByRole('button', { name: 'Count' }))
    expect(output().querySelectorAll('tbody tr')).toHaveLength(12)
  })

  it('shows zero totals for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Count' }))
    expect(await screen.findByTestId('word-frequency-totals')).toHaveTextContent(
      'Total words: 0 · Unique words: 0',
    )
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled()
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Word frequency input')
    setInput('hello world')
    await user.click(screen.getByRole('button', { name: 'Count' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/will appear here/)).toBeInTheDocument()
  })
})
