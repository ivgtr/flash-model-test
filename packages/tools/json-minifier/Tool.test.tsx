import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { JsonMinifierTool } from './Tool'

function setJsonInput(value: string) {
  fireEvent.change(screen.getByLabelText('JSON input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<JsonMinifierTool />)
  return { user }
}

describe('JsonMinifierTool', () => {
  it('minifies user input and shows the result with stats', async () => {
    const { user } = await setup()
    setJsonInput('{\n  "name": "Alice",\n  "age": 30\n}')
    await user.click(screen.getByRole('button', { name: 'Minify' }))
    const output = await screen.findByTestId('json-minifier-output')
    expect(output).toHaveTextContent('{"name":"Alice","age":30}', { normalizeWhitespace: false })
    const stats = screen.getByTestId('json-minifier-stats')
    expect(stats).toHaveTextContent('34 B')
    expect(stats).toHaveTextContent('25 B')
    expect(stats).toHaveTextContent('26.47% saved')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('pretty-prints when the pretty output mode is selected', async () => {
    const { user } = await setup()
    setJsonInput('{"name":"Alice","age":30}')
    await user.selectOptions(screen.getByLabelText('Output mode'), 'pretty')
    await user.click(screen.getByRole('button', { name: 'Minify' }))
    const output = await screen.findByTestId('json-minifier-output')
    expect(output).toHaveTextContent('{\n  "name": "Alice",\n  "age": 30\n}', {
      normalizeWhitespace: false,
    })
    expect(screen.getByTestId('json-minifier-stats')).toHaveTextContent('% saved')
  })

  it('shows an error for invalid JSON', async () => {
    const { user } = await setup()
    setJsonInput('{"broken": }')
    await user.click(screen.getByRole('button', { name: 'Minify' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid JSON')
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Minify' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('JSON input')
    setJsonInput('{"a": 1}')
    await user.click(screen.getByRole('button', { name: 'Minify' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Minified JSON will appear here/)).toBeInTheDocument()
  })
})
