import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { JsonToCsvTool } from './Tool'

function setJsonInput(value: string) {
  fireEvent.change(screen.getByLabelText('JSON input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<JsonToCsvTool />)
  return { user }
}

describe('JsonToCsvTool', () => {
  it('converts JSON input to CSV on demand', async () => {
    const { user } = await setup()
    setJsonInput('[{"name":"Alice","age":30},{"name":"Bob","age":25}]')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('csv-output')
    expect(output).toHaveTextContent(['name,age', 'Alice,30', 'Bob,25'].join('\n'), {
      normalizeWhitespace: false,
    })
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('uses the selected delimiter', async () => {
    const { user } = await setup()
    setJsonInput('[{"name":"Alice","age":30}]')
    await user.selectOptions(screen.getByLabelText('Delimiter'), ';')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('csv-output')
    expect(output).toHaveTextContent('name;age')
  })

  it('shows an error for invalid JSON', async () => {
    const { user } = await setup()
    setJsonInput('{not json')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid JSON')
  })

  it('shows an error for a primitive array', async () => {
    const { user } = await setup()
    setJsonInput('["a","b"]')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('must be an object')
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('JSON input')
    setJsonInput('[{"name":"Alice"}]')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/CSV will appear here/)).toBeInTheDocument()
  })
})
