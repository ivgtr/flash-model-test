import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Base64CodecTool } from './Tool'

function setInput(value: string) {
  fireEvent.change(screen.getByLabelText('Base64 input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<Base64CodecTool />)
  return { user }
}

describe('Base64CodecTool', () => {
  it('encodes user input on demand', async () => {
    const { user } = await setup()
    setInput('Hello')
    await user.click(screen.getByRole('button', { name: 'Encode' }))
    const output = await screen.findByTestId('base64-output')
    expect(output).toHaveTextContent('SGVsbG8=')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('decodes user input when direction is decode', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Direction'), 'decode')
    setInput('SGVsbG8=')
    await user.click(screen.getByRole('button', { name: 'Decode' }))
    const output = await screen.findByTestId('base64-output')
    expect(output).toHaveTextContent('Hello')
  })

  it('shows a visible error message and no garbage output for invalid Base64', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Direction'), 'decode')
    setInput('%%%')
    await user.click(screen.getByRole('button', { name: 'Decode' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid Base64')
    expect(screen.queryByTestId('base64-output')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument()
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Base64 input')
    setInput('Hello')
    await user.click(screen.getByRole('button', { name: 'Encode' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Converted text will appear here/)).toBeInTheDocument()
  })
})
