import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CsvFormatterTool } from './Tool'

function setCsvInput(value: string) {
  fireEvent.change(screen.getByLabelText('CSV input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<CsvFormatterTool />)
  return { user }
}

describe('CsvFormatterTool', () => {
  it('formats CSV input and shows the result', async () => {
    const { user } = await setup()
    setCsvInput('name,age\nAlice,30\nBob,25')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    const output = await screen.findByTestId('csv-formatter-output')
    expect(output).toHaveTextContent('name,age\nAlice,30\nBob,25', {
      normalizeWhitespace: false,
    })
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('applies the selected quote style', async () => {
    const { user } = await setup()
    setCsvInput('name,note\nAlice,has, comma')
    await user.selectOptions(screen.getByLabelText('Quote style'), 'always')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    const output = await screen.findByTestId('csv-formatter-output')
    expect(output).toHaveTextContent('"name","note"', { normalizeWhitespace: false })
  })

  it('applies the selected delimiter', async () => {
    const { user } = await setup()
    setCsvInput('name;age\nAlice;30')
    await user.selectOptions(screen.getByLabelText('Delimiter'), ';')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    const output = await screen.findByTestId('csv-formatter-output')
    expect(output).toHaveTextContent('name;age\nAlice;30', { normalizeWhitespace: false })
  })

  it('trims field values when the trim option is enabled', async () => {
    const { user } = await setup()
    setCsvInput('a,b\n  Alice  ,30')
    await user.click(screen.getByRole('checkbox', { name: 'Trim field values' }))
    await user.click(screen.getByRole('button', { name: 'Format' }))
    const output = await screen.findByTestId('csv-formatter-output')
    expect(output).toHaveTextContent('a,b\nAlice,30', { normalizeWhitespace: false })
  })

  it('removes blank lines when the option is enabled', async () => {
    const { user } = await setup()
    setCsvInput('a,b\n\nc,d')
    await user.click(screen.getByRole('checkbox', { name: 'Remove blank lines' }))
    await user.click(screen.getByRole('button', { name: 'Format' }))
    const output = await screen.findByTestId('csv-formatter-output')
    expect(output).toHaveTextContent('a,b\nc,d', { normalizeWhitespace: false })
  })

  it('shows an error for malformed CSV', async () => {
    const { user } = await setup()
    setCsvInput('a,b\n1,"unterminated')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('unterminated quoted field')
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Format' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('CSV input')
    setCsvInput('a,b\n1,2')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Formatted CSV will appear here/)).toBeInTheDocument()
  })
})
