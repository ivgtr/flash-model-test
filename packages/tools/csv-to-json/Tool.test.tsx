import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CsvToJsonTool } from './Tool'

function setCsvInput(value: string) {
  fireEvent.change(screen.getByLabelText('CSV input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<CsvToJsonTool />)
  return { user }
}

describe('CsvToJsonTool', () => {
  it('converts CSV input to JSON on demand', async () => {
    const { user } = await setup()
    setCsvInput('name,age\nAlice,30\nBob,25')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('csv-output')
    expect(output).toHaveTextContent(
      [
        '[',
        '  {',
        '    "name": "Alice",',
        '    "age": "30"',
        '  },',
        '  {',
        '    "name": "Bob",',
        '    "age": "25"',
        '  }',
        ']',
      ].join('\n'),
      { normalizeWhitespace: false },
    )
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('uses the selected delimiter', async () => {
    const { user } = await setup()
    setCsvInput('name;age\nAlice;30')
    await user.selectOptions(screen.getByLabelText('Delimiter'), ';')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('csv-output')
    expect(output).toHaveTextContent('"name": "Alice"')
  })

  it('shows an error for a column count mismatch', async () => {
    const { user } = await setup()
    setCsvInput('name,age\nAlice,30\nBob')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('expected 2')
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('CSV input')
    setCsvInput('name,age\nAlice,30')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/JSON will appear here/)).toBeInTheDocument()
  })
})
