import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CharacterCodeConverterTool } from './Tool'

function setInput(value: string) {
  fireEvent.change(screen.getByLabelText('Code converter input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<CharacterCodeConverterTool />)
  return { user }
}

describe('CharacterCodeConverterTool', () => {
  it('shows code values for entered characters', async () => {
    const { user } = await setup()
    setInput('A')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('character-code-output')
    expect(output).toHaveTextContent('decimal=65')
    expect(output).toHaveTextContent('U+41')
    expect(output).toHaveTextContent('binary=1000001')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('converts codes to characters in the reverse direction', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Direction'), 'to-chars')
    setInput('72,97,112,112,121')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('character-code-output')
    expect(output).toHaveTextContent('Happy')
  })

  it('shows an error for invalid codes', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Direction'), 'to-chars')
    setInput('0x110000')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('out of range')
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Code converter input')
    setInput('A')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Code values will appear here/)).toBeInTheDocument()
  })
})
