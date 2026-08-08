import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RegexTesterTool } from './Tool'

function setInputs(pattern: string, text: string) {
  fireEvent.change(screen.getByLabelText('Pattern'), { target: { value: pattern } })
  fireEvent.change(screen.getByLabelText('Test string'), { target: { value: text } })
}

async function setup() {
  const user = userEvent.setup()
  render(<RegexTesterTool />)
  return { user }
}

describe('RegexTesterTool', () => {
  it('shows all matches when the user enters a pattern and test string and presses Test', async () => {
    const { user } = await setup()
    setInputs('\\d+', 'abc 123 x 456')
    await user.click(screen.getByRole('checkbox', { name: 'g' }))
    await user.click(screen.getByRole('button', { name: 'Test' }))
    expect(await screen.findByTestId('match-count')).toHaveTextContent('2 matches')
    const list = screen.getByTestId('match-list')
    expect(list).toHaveTextContent('123')
    expect(list).toHaveTextContent('456')
    expect(list).toHaveTextContent('0')
    expect(list).toHaveTextContent('10')
  })

  it('shows an error for an invalid pattern', async () => {
    const { user } = await setup()
    setInputs('(', 'abc')
    await user.click(screen.getByRole('button', { name: 'Test' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid pattern')
  })

  it('shows an error for an empty pattern', async () => {
    const { user } = await setup()
    setInputs('', 'abc')
    await user.click(screen.getByRole('button', { name: 'Test' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Pattern is empty')
  })

  it('shows No match when there are no matches', async () => {
    const { user } = await setup()
    setInputs('xyz', 'abc')
    await user.click(screen.getByRole('button', { name: 'Test' }))
    expect(await screen.findByTestId('match-count')).toHaveTextContent('No match')
  })

  it('shows only the first match without the g flag', async () => {
    const { user } = await setup()
    setInputs('\\d+', 'abc 123 x 456')
    await user.click(screen.getByRole('button', { name: 'Test' }))
    expect(await screen.findByTestId('match-count')).toHaveTextContent('1 match')
  })

  it('shows capture groups and named groups', async () => {
    const { user } = await setup()
    setInputs('(?<year>\\d{4})-(\\d{2})', '2024-01')
    await user.click(screen.getByRole('button', { name: 'Test' }))
    const list = await screen.findByTestId('match-list')
    expect(list).toHaveTextContent('year')
    expect(list).toHaveTextContent('2024')
    expect(list).toHaveTextContent('01')
  })

  it('clears input and results', async () => {
    const { user } = await setup()
    setInputs('\\d+', 'abc 123')
    await user.click(screen.getByRole('button', { name: 'Test' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByLabelText('Pattern')).toHaveValue('')
    expect(screen.getByLabelText('Test string')).toHaveValue('')
    expect(screen.getByText(/Test results will appear here/)).toBeInTheDocument()
  })
})
