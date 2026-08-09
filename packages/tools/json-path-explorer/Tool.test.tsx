import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { JsonPathExplorerTool } from './Tool'

function setJsonInput(value: string) {
  fireEvent.change(screen.getByLabelText('JSON input'), { target: { value } })
}

function setPathInput(value: string) {
  fireEvent.change(screen.getByLabelText('JSONPath input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<JsonPathExplorerTool />)
  return { user }
}

describe('JsonPathExplorerTool', () => {
  it('shows the value and type when the user explores a path', async () => {
    const { user } = await setup()
    setJsonInput('{"user": {"name": "Alice", "scores": [9, 8]}}')
    setPathInput('$.user.scores[1]')
    await user.click(screen.getByRole('button', { name: 'Explore' }))
    expect(await screen.findByTestId('json-path-value')).toHaveTextContent('8')
    expect(screen.getByTestId('json-path-type')).toHaveTextContent('number')
  })

  it('shows the root document for the path $', async () => {
    const { user } = await setup()
    setJsonInput('{"a": [1, 2]}')
    setPathInput('$')
    await user.click(screen.getByRole('button', { name: 'Explore' }))
    const value = await screen.findByTestId('json-path-value')
    expect(value).toHaveTextContent('"a"')
    expect(value).toHaveTextContent(/\[ 1, 2 \]/)
    expect(screen.getByTestId('json-path-type')).toHaveTextContent('object')
  })

  it('shows an error for a missing key', async () => {
    const { user } = await setup()
    setJsonInput('{"user": {"name": "Alice"}}')
    setPathInput('$.user.missing')
    await user.click(screen.getByRole('button', { name: 'Explore' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Not found')
  })

  it('shows an error for unsupported syntax', async () => {
    const { user } = await setup()
    setJsonInput('{"user": {"name": "Alice"}}')
    setPathInput('$..name')
    await user.click(screen.getByRole('button', { name: 'Explore' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Unsupported syntax')
  })

  it('shows an error for invalid JSON', async () => {
    const { user } = await setup()
    setJsonInput('{ not json')
    setPathInput('$.a')
    await user.click(screen.getByRole('button', { name: 'Explore' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid JSON')
  })

  it('shows an error when the JSON input is empty', async () => {
    const { user } = await setup()
    setPathInput('$.a')
    await user.click(screen.getByRole('button', { name: 'Explore' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input JSON is empty')
  })

  it('shows an error when the path is empty', async () => {
    const { user } = await setup()
    setJsonInput('{"a": 1}')
    await user.click(screen.getByRole('button', { name: 'Explore' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Path is empty')
  })

  it('offers a copy button for a successful result', async () => {
    const { user } = await setup()
    setJsonInput('{"a": "hi"}')
    setPathInput('$.a')
    await user.click(screen.getByRole('button', { name: 'Explore' }))
    await screen.findByTestId('json-path-value')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('clears inputs and the result', async () => {
    const { user } = await setup()
    const jsonInput = screen.getByLabelText('JSON input')
    const pathInput = screen.getByLabelText('JSONPath input')
    setJsonInput('{"a": 1}')
    setPathInput('$.a')
    await user.click(screen.getByRole('button', { name: 'Explore' }))
    await screen.findByTestId('json-path-result')
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(jsonInput).toHaveValue('')
    expect(pathInput).toHaveValue('')
    expect(screen.getByText(/Explore a JSONPath/)).toBeInTheDocument()
  })

  it('documents the supported syntax scope', () => {
    render(<JsonPathExplorerTool />)
    expect(screen.getByText(/Supported syntax/)).toBeInTheDocument()
    expect(screen.getByText(/not supported/)).toBeInTheDocument()
  })
})
