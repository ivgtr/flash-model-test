import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { serializeToolState } from '@tool-forge/core'
import { JsonFormatterTool } from './Tool'
import { jsonFormatterStateCodec } from './state'

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

  it('restores input state from a shared URL and recomputes the result', () => {
    const state = { input: '{"a":1}', indent: 4 }
    const serialized = serializeToolState(state, jsonFormatterStateCodec)
    expect(serialized).not.toBeNull()
    window.history.replaceState({}, '', `/tools/json-formatter?s=${serialized!}`)
    render(<JsonFormatterTool />)
    expect(screen.getByLabelText('JSON input')).toHaveValue('{"a":1}')
    expect(screen.getByLabelText('Indent')).toHaveValue('4')
    expect(screen.getByTestId('json-output')).toHaveTextContent('{\n    "a": 1\n}', {
      normalizeWhitespace: false,
    })
  })

  it('falls back to defaults for a malformed state URL', () => {
    window.history.replaceState({}, '', '/tools/json-formatter?s=1.garbage!!!')
    render(<JsonFormatterTool />)
    expect(screen.getByLabelText('JSON input')).toHaveValue('')
    expect(screen.getByLabelText('Indent')).toHaveValue('2')
    expect(screen.getByText(/Formatted JSON will appear here/)).toBeInTheDocument()
  })

  it('copies a share URL containing the serialized state', async () => {
    window.history.replaceState({}, '', '/tools/json-formatter')
    const { user } = await setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    const shareButton = screen.getByRole('button', { name: 'Share' })
    expect(shareButton).toBeDisabled()
    setJsonInput('{"a":1}')
    expect(shareButton).toBeEnabled()
    await user.click(shareButton)
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/tools/json-formatter?s=1.'))
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })
})
