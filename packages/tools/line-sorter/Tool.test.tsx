import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { LineSorterTool } from './Tool'

function setTextInput(value: string) {
  fireEvent.change(screen.getByLabelText('Text input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<LineSorterTool />)
  return { user }
}

async function sortAndReadOutput(user: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> {
  await user.click(screen.getByRole('button', { name: 'Sort' }))
  return screen.findByTestId('line-sorter-output')
}

describe('LineSorterTool', () => {
  it('sorts the entered text and displays the result', async () => {
    const { user } = await setup()
    setTextInput('banana\napple\ncherry')
    const output = await sortAndReadOutput(user)
    expect(output).toHaveTextContent('apple\nbanana\ncherry', { normalizeWhitespace: false })
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('sorts in descending order when the direction is changed', async () => {
    const { user } = await setup()
    setTextInput('banana\napple\ncherry')
    await user.selectOptions(screen.getByLabelText('Direction'), 'desc')
    const output = await sortAndReadOutput(user)
    expect(output).toHaveTextContent('cherry\nbanana\napple', { normalizeWhitespace: false })
  })

  it('sorts naturally when the natural sort option is enabled', async () => {
    const { user } = await setup()
    setTextInput('file10\nfile2\nfile1')
    await user.click(screen.getByRole('checkbox', { name: 'Natural sort' }))
    const output = await sortAndReadOutput(user)
    expect(output).toHaveTextContent('file1\nfile2\nfile10', { normalizeWhitespace: false })
  })

  it('ignores case when the case-sensitive option is disabled', async () => {
    const { user } = await setup()
    setTextInput('banana\nApple')
    await user.click(screen.getByRole('checkbox', { name: 'Case-sensitive' }))
    const output = await sortAndReadOutput(user)
    expect(output).toHaveTextContent('Apple\nbanana', { normalizeWhitespace: false })
  })

  it('ignores leading whitespace when enabled', async () => {
    const { user } = await setup()
    setTextInput(' banana\napple')
    await user.click(screen.getByRole('checkbox', { name: 'Ignore leading whitespace' }))
    const output = await sortAndReadOutput(user)
    expect(output).toHaveTextContent('apple\n banana', { normalizeWhitespace: false })
  })

  it('removes blank lines when enabled', async () => {
    const { user } = await setup()
    setTextInput('b\n\na\n')
    await user.click(screen.getByRole('checkbox', { name: 'Remove blank lines' }))
    const output = await sortAndReadOutput(user)
    expect(output).toHaveTextContent('a\nb', { normalizeWhitespace: false })
  })

  it('shows an empty result for empty input without erroring', async () => {
    const { user } = await setup()
    const output = await sortAndReadOutput(user)
    expect(output).toHaveTextContent('')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Text input')
    setTextInput('b\na')
    await sortAndReadOutput(user)
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Sorted lines will appear here/)).toBeInTheDocument()
  })
})
