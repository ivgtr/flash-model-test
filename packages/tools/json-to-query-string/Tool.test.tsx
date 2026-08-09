import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { JsonToQueryStringTool } from './Tool'

function setJsonInput(value: string) {
  fireEvent.change(screen.getByLabelText('JSON input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<JsonToQueryStringTool />)
  return { user }
}

describe('JsonToQueryStringTool', () => {
  it('converts JSON input to a query string on demand', async () => {
    const { user } = await setup()
    setJsonInput('{"name":"Alice","age":30,"active":true}')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('query-string-output')
    expect(output).toHaveTextContent('name=Alice&age=30&active=true')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('prepends a leading question mark when enabled', async () => {
    const { user } = await setup()
    setJsonInput('{"tag":"a"}')
    await user.click(screen.getByLabelText('Prepend leading ?'))
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByTestId('query-string-output')).toHaveTextContent('?tag=a')
  })

  it('shows an error for invalid JSON', async () => {
    const { user } = await setup()
    setJsonInput('{"name":')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid JSON')
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('JSON input')
    setJsonInput('{"name":"Alice"}')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Query string will appear here/)).toBeInTheDocument()
  })
})
