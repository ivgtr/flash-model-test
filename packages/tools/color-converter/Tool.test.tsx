import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { serializeToolState } from '@tool-forge/core'
import { ColorConverterTool } from './Tool'
import { colorConverterStateCodec } from './state'

function setColorInput(value: string) {
  fireEvent.change(screen.getByLabelText('Color input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<ColorConverterTool />)
  return { user }
}

describe('ColorConverterTool', () => {
  it('converts a color on demand and shows all formats', async () => {
    const { user } = await setup()
    setColorInput('#ff0000')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('color-output')
    expect(output).toHaveTextContent('#ff0000')
    expect(output).toHaveTextContent('rgb(255, 0, 0)')
    expect(output).toHaveTextContent('hsl(0, 100%, 50%)')
    expect(screen.getByRole('button', { name: 'Copy HEX' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Copy RGB' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Copy HSL' })).toBeEnabled()
  })

  it('shows an error for invalid input and no leftover output', async () => {
    const { user } = await setup()
    setColorInput('#ff0000')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByTestId('color-output')).toBeInTheDocument()

    setColorInput('not-a-color')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Unsupported format')
    expect(screen.queryByTestId('color-output')).not.toBeInTheDocument()
  })

  it('does not treat empty input as an error', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText(/Converted color will appear here/)).toBeInTheDocument()
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Color input')
    setColorInput('#fff')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByTestId('color-output')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Converted color will appear here/)).toBeInTheDocument()
  })

  it('restores input state from a shared URL and recomputes the result', () => {
    const state = { input: '#00ff00' }
    const serialized = serializeToolState(state, colorConverterStateCodec)
    expect(serialized).not.toBeNull()
    window.history.replaceState({}, '', `/tools/color-converter?s=${serialized!}`)
    render(<ColorConverterTool />)
    expect(screen.getByLabelText('Color input')).toHaveValue('#00ff00')
    const output = screen.getByTestId('color-output')
    expect(output).toHaveTextContent('rgb(0, 255, 0)')
    expect(output).toHaveTextContent('hsl(120, 100%, 50%)')
  })

  it('falls back to defaults for a malformed state URL', () => {
    window.history.replaceState({}, '', '/tools/color-converter?s=1.garbage!!!')
    render(<ColorConverterTool />)
    expect(screen.getByLabelText('Color input')).toHaveValue('')
    expect(screen.getByText(/Converted color will appear here/)).toBeInTheDocument()
  })

  it('enables Share once state differs from defaults', async () => {
    window.history.replaceState({}, '', '/tools/color-converter')
    await setup()
    const shareButton = screen.getByRole('button', { name: 'Share' })
    expect(shareButton).toBeDisabled()
    setColorInput('#fff')
    expect(shareButton).toBeEnabled()
  })

  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })
})
