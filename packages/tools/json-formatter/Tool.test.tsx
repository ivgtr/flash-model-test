import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { JsonFormatterTool } from './Tool'

function setJsonInput(value: string) {
  fireEvent.change(screen.getByLabelText('JSON input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<JsonFormatterTool />)
  return { user }
}

describe('JsonFormatterTool', () => {
  it('formats valid JSON on demand', async () => {
    const { user } = await setup()
    setJsonInput('{"a":1,"b":[true,null]}')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    const output = await screen.findByTestId('json-output')
    expect(output).toHaveTextContent('{\n  "a": 1,\n  "b": [\n    true,\n    null\n  ]\n}', {
      normalizeWhitespace: false,
    })
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('shows an error for malformed JSON', async () => {
    const { user } = await setup()
    setJsonInput('{"a":}')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid JSON')
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Format' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('uses the selected indent', async () => {
    const { user } = await setup()
    setJsonInput('{"a":1}')
    await user.selectOptions(screen.getByLabelText('Indent'), '4')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    const output = await screen.findByTestId('json-output')
    expect(output).toHaveTextContent('{\n    "a": 1\n}', { normalizeWhitespace: false })
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('JSON input')
    setJsonInput('{"a":1}')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Formatted JSON will appear here/)).toBeInTheDocument()
  })
})
