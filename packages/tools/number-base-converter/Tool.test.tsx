import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { NumberBaseConverterTool } from './Tool'

function setNumberInput(value: string) {
  fireEvent.change(screen.getByLabelText('Number input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<NumberBaseConverterTool />)
  return { user }
}

describe('NumberBaseConverterTool', () => {
  it('converts decimal to hexadecimal with the default bases', async () => {
    const { user } = await setup()
    setNumberInput('255')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('number-output')
    expect(output).toHaveTextContent('ff')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('converts with user-selected input and output bases', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Input base'), '16')
    await user.selectOptions(screen.getByLabelText('Output base'), '10')
    setNumberInput('ff')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('number-output')
    expect(output).toHaveTextContent('255')
  })

  it('shows an error for digits invalid in the input base', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Input base'), '2')
    setNumberInput('2')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid digit "2" for base 2')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Number input')
    setNumberInput('255')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Converted number will appear here/)).toBeInTheDocument()
  })
})
