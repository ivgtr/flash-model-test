import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TextDiffTool } from './Tool'

function setText(ariaLabel: string, value: string) {
  fireEvent.change(screen.getByLabelText(ariaLabel), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<TextDiffTool />)
  return { user }
}

function diffLine(type: string, text: string) {
  return screen
    .getAllByTestId('diff-line')
    .find(
      (row) =>
        row.getAttribute('data-type') === type &&
        within(row).getByTestId('diff-line-text').textContent === text,
    )
}

describe('TextDiffTool', () => {
  it('shows the diff when the user enters two texts', async () => {
    const { user } = await setup()
    setText('Original text', 'alpha\nbeta\ngamma')
    setText('Changed text', 'alpha\nBETA\ngamma')
    await user.click(screen.getByRole('button', { name: 'Diff' }))

    const output = await screen.findByTestId('text-diff-output')
    expect(within(output).getAllByTestId('diff-line')).toHaveLength(4)

    const unchanged = diffLine('same', 'alpha')
    const removed = diffLine('remove', 'beta')
    const added = diffLine('add', 'BETA')
    const tail = diffLine('same', 'gamma')
    expect(unchanged).toBeDefined()
    expect(removed).toBeDefined()
    expect(added).toBeDefined()
    expect(tail).toBeDefined()

    expect(within(output).getByTestId('diff-summary')).toHaveTextContent('Added: 1, Removed: 1')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('distinguishes additions and removals in the display', async () => {
    const { user } = await setup()
    setText('Original text', 'one\ntwo\nthree')
    setText('Changed text', 'one\nTWO')
    await user.click(screen.getByRole('button', { name: 'Diff' }))

    const rows = await screen.findAllByTestId('diff-line')
    expect(rows.map((row) => row.getAttribute('data-type'))).toEqual([
      'same',
      'remove',
      'remove',
      'add',
    ])

    const markers = screen.getAllByTestId('diff-marker').map((marker) => marker.textContent)
    expect(markers).toContain('+')
    expect(markers).toContain('-')
    expect(markers).toContain(' ')

    const addedRow = rows.find((row) => row.getAttribute('data-type') === 'add')
    const removedTexts = rows
      .filter((row) => row.getAttribute('data-type') === 'remove')
      .map((row) => within(row).getByTestId('diff-line-text').textContent)
    expect(addedRow).toBeDefined()
    expect(within(addedRow!).getByTestId('diff-line-text')).toHaveTextContent('TWO')
    expect(removedTexts).toEqual(['two', 'three'])
  })

  it('shows zero counts for identical texts', async () => {
    const { user } = await setup()
    setText('Original text', 'a\nb')
    setText('Changed text', 'a\nb')
    await user.click(screen.getByRole('button', { name: 'Diff' }))

    const output = await screen.findByTestId('text-diff-output')
    expect(within(output).getByTestId('diff-summary')).toHaveTextContent('Added: 0, Removed: 0')
    expect(within(output).getAllByTestId('diff-line').length).toBeGreaterThan(0)
  })

  it('shows an error when a text exceeds the line limit', async () => {
    const { user } = await setup()
    const tooMany = Array.from({ length: 2001 }, (_, index) => `line ${index}`).join('\n')
    setText('Original text', tooMany)
    setText('Changed text', 'a')
    await user.click(screen.getByRole('button', { name: 'Diff' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('too large')
  })

  it('clears both inputs and the output', async () => {
    const { user } = await setup()
    const original = screen.getByLabelText('Original text')
    const changed = screen.getByLabelText('Changed text')
    setText('Original text', 'a\nb')
    setText('Changed text', 'a\nc')
    await user.click(screen.getByRole('button', { name: 'Diff' }))
    expect(screen.getByTestId('text-diff-output')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(original).toHaveValue('')
    expect(changed).toHaveValue('')
    expect(screen.queryByTestId('text-diff-output')).not.toBeInTheDocument()
    expect(screen.getByText(/Diff will appear here/)).toBeInTheDocument()
  })

  it('disables the Clear button until there is something to clear', async () => {
    const { user } = await setup()
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
    setText('Original text', 'a')
    expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
  })
})
