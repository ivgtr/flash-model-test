import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { serializeToolState } from '@tool-forge/core'
import { Base64CodecTool } from './Tool'
import { base64CodecStateCodec } from './state'

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

  it('restores direction and input state from a shared URL and recomputes the result', () => {
    const state = { direction: 'decode' as const, input: 'SGVsbG8=' }
    const serialized = serializeToolState(state, base64CodecStateCodec)
    expect(serialized).not.toBeNull()
    window.history.replaceState({}, '', `/tools/base64-codec?s=${serialized!}`)
    render(<Base64CodecTool />)
    expect(screen.getByLabelText('Direction')).toHaveValue('decode')
    expect(screen.getByLabelText('Base64 input')).toHaveValue('SGVsbG8=')
    expect(screen.getByTestId('base64-output')).toHaveTextContent('Hello')
  })

  it('falls back to defaults for a malformed state URL', () => {
    window.history.replaceState({}, '', '/tools/base64-codec?s=1.garbage!!!')
    render(<Base64CodecTool />)
    expect(screen.getByLabelText('Direction')).toHaveValue('encode')
    expect(screen.getByLabelText('Base64 input')).toHaveValue('')
    expect(screen.getByText(/Converted text will appear here/)).toBeInTheDocument()
  })

  it('copies a share URL containing the serialized state', async () => {
    window.history.replaceState({}, '', '/tools/base64-codec')
    const { user } = await setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    const shareButton = screen.getByRole('button', { name: 'Share' })
    expect(shareButton).toBeDisabled()
    setInput('Hello')
    expect(shareButton).toBeEnabled()
    await user.click(shareButton)
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/tools/base64-codec?s=1.'))
  })

  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })
})
