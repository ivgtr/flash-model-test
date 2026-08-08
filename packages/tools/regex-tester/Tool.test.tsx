import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { serializeToolState } from '@tool-forge/core'
import { RegexTesterTool } from './Tool'
import { regexTesterStateCodec, type RegexTesterState } from './state'

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

  it('restores pattern, flags and text from a shared URL and recomputes the result', () => {
    const state: RegexTesterState = { pattern: '\\d+', flags: ['g', 'i'], text: 'abc 123 x 456' }
    const serialized = serializeToolState(state, regexTesterStateCodec)
    expect(serialized).not.toBeNull()
    window.history.replaceState({}, '', `/tools/regex-tester?s=${serialized!}`)
    render(<RegexTesterTool />)
    expect(screen.getByLabelText('Pattern')).toHaveValue('\\d+')
    expect(screen.getByLabelText('Test string')).toHaveValue('abc 123 x 456')
    expect(screen.getByRole('checkbox', { name: 'g' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'i' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'm' })).not.toBeChecked()
    expect(screen.getByTestId('match-count')).toHaveTextContent('2 matches')
  })

  it('falls back to defaults for a malformed state URL', () => {
    window.history.replaceState({}, '', '/tools/regex-tester?s=1.garbage!!!')
    render(<RegexTesterTool />)
    expect(screen.getByLabelText('Pattern')).toHaveValue('')
    expect(screen.getByLabelText('Test string')).toHaveValue('')
    expect(screen.getByRole('checkbox', { name: 'g' })).not.toBeChecked()
    expect(screen.getByText(/Test results will appear here/)).toBeInTheDocument()
  })

  it('copies a share URL containing the serialized state', async () => {
    window.history.replaceState({}, '', '/tools/regex-tester')
    const { user } = await setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    const shareButton = screen.getByRole('button', { name: 'Share' })
    expect(shareButton).toBeDisabled()
    setInputs('\\d+', 'abc')
    expect(shareButton).toBeEnabled()
    await user.click(shareButton)
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/tools/regex-tester?s=1.'))
  })

  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })
})
