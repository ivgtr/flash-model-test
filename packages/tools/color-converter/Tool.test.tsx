import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ColorConverterTool } from './Tool'

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
})
