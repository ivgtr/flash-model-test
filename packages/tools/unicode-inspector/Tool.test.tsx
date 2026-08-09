import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { UnicodeInspectorTool } from './Tool'

function setInput(value: string) {
  fireEvent.change(screen.getByLabelText('Text to inspect'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<UnicodeInspectorTool />)
  return { user }
}

describe('UnicodeInspectorTool', () => {
  it('shows the inspection result after entering text and clicking Inspect', async () => {
    const { user } = await setup()
    setInput('Aあ')
    await user.click(screen.getByRole('button', { name: 'Inspect' }))
    const table = await screen.findByTestId('unicode-inspector-output')
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(3)
    expect(rows[1]).toHaveTextContent('A')
    expect(rows[1]).toHaveTextContent('U+0041')
    expect(rows[1]).toHaveTextContent('65')
    expect(rows[1]).toHaveTextContent('0x0041')
    expect(rows[1]).toHaveTextContent('41')
    expect(rows[2]).toHaveTextContent('あ')
    expect(rows[2]).toHaveTextContent('U+3042')
    expect(rows[2]).toHaveTextContent('E3 81 82')
    expect(screen.getByTestId('unicode-inspector-stats')).toHaveTextContent('Code points2')
    expect(screen.getByTestId('unicode-inspector-stats')).toHaveTextContent('UTF-16 units2')
    expect(screen.getByTestId('unicode-inspector-stats')).toHaveTextContent('UTF-8 bytes4')
  })

  it('shows an emoji as one astral row with two UTF-16 units', async () => {
    const { user } = await setup()
    setInput('😀')
    await user.click(screen.getByRole('button', { name: 'Inspect' }))
    const table = await screen.findByTestId('unicode-inspector-output')
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(2)
    expect(rows[1]).toHaveTextContent('😀')
    expect(rows[1]).toHaveTextContent('U+1F600')
    expect(rows[1]).toHaveTextContent('astral')
    expect(rows[1]).toHaveTextContent('0xD83D 0xDE00')
    expect(rows[1]).toHaveTextContent('F0 9F 98 80')
    expect(screen.getByTestId('unicode-inspector-stats')).toHaveTextContent('Code points1')
    expect(screen.getByTestId('unicode-inspector-stats')).toHaveTextContent('UTF-16 units2')
    expect(screen.getByTestId('unicode-inspector-stats')).toHaveTextContent('UTF-8 bytes4')
  })

  it('shows a control character using escape notation', async () => {
    const { user } = await setup()
    setInput('a\nb')
    await user.click(screen.getByRole('button', { name: 'Inspect' }))
    const table = await screen.findByTestId('unicode-inspector-output')
    const rows = within(table).getAllByRole('row')
    expect(rows[2]).toHaveTextContent('\\n')
    expect(rows[2]).toHaveTextContent('U+000A')
    expect(rows[2]).toHaveTextContent('0x000A')
  })

  it('shows zero statistics for empty input without an error', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Inspect' }))
    const stats = await screen.findByTestId('unicode-inspector-stats')
    expect(stats).toHaveTextContent('Code points0')
    expect(stats).toHaveTextContent('UTF-16 units0')
    expect(stats).toHaveTextContent('UTF-8 bytes0')
    expect(screen.getByText('No characters to inspect.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows an error for input beyond the code point limit', async () => {
    const { user } = await setup()
    setInput('x'.repeat(1001))
    await user.click(screen.getByRole('button', { name: 'Inspect' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('limit of 1000 code points')
  })

  it('exposes the result through the Copy button', async () => {
    const { user } = await setup()
    setInput('A😀')
    await user.click(screen.getByRole('button', { name: 'Inspect' }))
    expect(await screen.findByTestId('unicode-inspector-output')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('clears the input and the result', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Text to inspect')
    setInput('abc')
    await user.click(screen.getByRole('button', { name: 'Inspect' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.queryByTestId('unicode-inspector-output')).not.toBeInTheDocument()
    expect(screen.getByText('Inspection will appear here.')).toBeInTheDocument()
  })

  it('always shows the no-database note', async () => {
    await setup()
    expect(screen.getByTestId('unicode-inspector-note')).toHaveTextContent(
      'does not bundle a Unicode name or category database',
    )
  })
})
