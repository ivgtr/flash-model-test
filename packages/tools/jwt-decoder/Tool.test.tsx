import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { JwtDecoderTool } from './Tool'

const HEADER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
const PAYLOAD = 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ'
const SIGNATURE = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

const TOKEN = [HEADER, PAYLOAD, SIGNATURE].join('.')

function setJwtInput(value: string) {
  fireEvent.change(screen.getByLabelText('JWT input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<JwtDecoderTool />)
  return { user }
}

describe('JwtDecoderTool', () => {
  it('decodes a user-supplied JWT on demand', async () => {
    const { user } = await setup()
    setJwtInput(TOKEN)
    await user.click(screen.getByRole('button', { name: 'Decode' }))
    const output = await screen.findByTestId('jwt-output')
    expect(output).toHaveTextContent('"alg": "HS256"')
    expect(output).toHaveTextContent('"sub": "1234567890"')
    expect(output).toHaveTextContent(SIGNATURE)
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('shows the signature-not-verified note', async () => {
    const { user } = await setup()
    setJwtInput(TOKEN)
    await user.click(screen.getByRole('button', { name: 'Decode' }))
    expect(await screen.findByText(/Signature is not verified/)).toBeInTheDocument()
  })

  it('shows errors visibly for invalid input', async () => {
    const { user } = await setup()
    setJwtInput('not-a-jwt')
    await user.click(screen.getByRole('button', { name: 'Decode' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("expected 3 parts separated by '.'")
    expect(screen.queryByTestId('jwt-output')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument()
  })

  it('shows an error for a payload that is not JSON', async () => {
    const { user } = await setup()
    setJwtInput(`${HEADER}.aGVsbG8.${SIGNATURE}`)
    await user.click(screen.getByRole('button', { name: 'Decode' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('payload is not valid JSON')
  })

  it('shows an error for an empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Decode' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('JWT input')
    setJwtInput(TOKEN)
    await user.click(screen.getByRole('button', { name: 'Decode' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Decoded JWT will appear here/)).toBeInTheDocument()
  })
})
