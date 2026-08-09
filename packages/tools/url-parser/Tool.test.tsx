import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { UrlParserTool } from './Tool'

function setUrlInput(value: string) {
  fireEvent.change(screen.getByLabelText('URL input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<UrlParserTool />)
  return { user }
}

describe('UrlParserTool', () => {
  it('parses a URL and displays its components', async () => {
    const { user } = await setup()
    setUrlInput('https://user:pass@example.com:8080/path/to/page?q=hello#section-1')
    await user.click(screen.getByRole('button', { name: 'Parse' }))
    const parts = await screen.findByTestId('url-parts')
    expect(parts).toHaveTextContent('https:')
    expect(parts).toHaveTextContent('example.com:8080')
    expect(parts).toHaveTextContent('8080')
    expect(parts).toHaveTextContent('/path/to/page')
    expect(parts).toHaveTextContent('#section-1')
    expect(parts).toHaveTextContent('user')
    expect(parts).toHaveTextContent('pass')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('displays query parameters as a list of key/value pairs', async () => {
    const { user } = await setup()
    setUrlInput('https://example.com/search?q=hello&lang=ja')
    await user.click(screen.getByRole('button', { name: 'Parse' }))
    const params = await screen.findByTestId('url-params')
    expect(params).toHaveTextContent('q')
    expect(params).toHaveTextContent('hello')
    expect(params).toHaveTextContent('lang')
    expect(params).toHaveTextContent('ja')
    expect(screen.queryByTestId('url-params-empty')).not.toBeInTheDocument()
  })

  it('shows an empty params note for a URL without a query', async () => {
    const { user } = await setup()
    setUrlInput('https://example.com/')
    await user.click(screen.getByRole('button', { name: 'Parse' }))
    expect(await screen.findByTestId('url-params-empty')).toHaveTextContent('No query parameters.')
  })

  it('shows an error for a relative URL', async () => {
    const { user } = await setup()
    setUrlInput('/path/to/page')
    await user.click(screen.getByRole('button', { name: 'Parse' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid URL')
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Parse' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('URL input')
    setUrlInput('https://example.com/path')
    await user.click(screen.getByRole('button', { name: 'Parse' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Parsed URL parts will appear here/)).toBeInTheDocument()
  })
})
