import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ChmodCalculatorTool } from './Tool'

function setModeInput(value: string) {
  fireEvent.change(screen.getByLabelText('Mode input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<ChmodCalculatorTool />)
  return { user }
}

describe('ChmodCalculatorTool', () => {
  it('converts an octal input and shows all representations', async () => {
    const { user } = await setup()
    setModeInput('755')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const table = await screen.findByTestId('chmod-result')
    expect(table).toHaveTextContent('0755')
    expect(table).toHaveTextContent('rwxr-xr-x')
    expect(table).toHaveTextContent('000111101101')
    expect(table).toHaveTextContent('User (owner)')
    expect(table).toHaveTextContent('Group')
    expect(table).toHaveTextContent('Other')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('converts an octal input with special bits', async () => {
    const { user } = await setup()
    setModeInput('4755')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const table = await screen.findByTestId('chmod-result')
    expect(table).toHaveTextContent('4755')
    expect(table).toHaveTextContent('rwsr-xr-x')
    expect(table).toHaveTextContent('100111101101')
  })

  it('converts a symbolic input back to octal', async () => {
    const { user } = await setup()
    setModeInput('rwxr-xr-x')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const table = await screen.findByTestId('chmod-result')
    expect(table).toHaveTextContent('0755')
    expect(table).toHaveTextContent('rwxr-xr-x')
  })

  it('converts a symbolic input with special bits', async () => {
    const { user } = await setup()
    setModeInput('rwsr-xr-x')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const table = await screen.findByTestId('chmod-result')
    expect(table).toHaveTextContent('4755')
    expect(table).toHaveTextContent('rwsr-xr-x')
  })

  it('shows an error for an invalid input', async () => {
    const { user } = await setup()
    setModeInput('8')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('8 and 9')
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Mode input')
    setModeInput('755')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Converted mode will appear here/)).toBeInTheDocument()
  })
})
