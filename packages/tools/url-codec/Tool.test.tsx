import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { UrlCodecTool } from './Tool'

function setInput(value: string) {
  fireEvent.change(screen.getByLabelText('URL input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<UrlCodecTool />)
  return { user }
}

describe('UrlCodecTool', () => {
  it('encodes user input on demand', async () => {
    const { user } = await setup()
    setInput('a b&c')
    await user.click(screen.getByRole('button', { name: 'Encode' }))
    const output = await screen.findByTestId('url-output')
    expect(output).toHaveTextContent('a%20b%26c')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('decodes user input when direction is decode', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Direction'), 'decode')
    setInput('Hello%2C%20World%21')
    await user.click(screen.getByRole('button', { name: 'Decode' }))
    const output = await screen.findByTestId('url-output')
    expect(output).toHaveTextContent('Hello, World!')
  })

  it('shows a visible error message and no garbage output for malformed encoding', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Direction'), 'decode')
    setInput('%zz')
    await user.click(screen.getByRole('button', { name: 'Decode' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid percent-encoding')
    expect(screen.queryByTestId('url-output')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument()
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('URL input')
    setInput('hello')
    await user.click(screen.getByRole('button', { name: 'Encode' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Converted text will appear here/)).toBeInTheDocument()
  })
})
