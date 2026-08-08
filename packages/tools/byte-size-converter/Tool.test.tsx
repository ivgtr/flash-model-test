import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ByteSizeConverterTool } from './Tool'

async function setup() {
  const user = userEvent.setup()
  render(<ByteSizeConverterTool />)
  return { user }
}

describe('ByteSizeConverterTool', () => {
  it('converts a value in the selected unit', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('Byte value'), { target: { value: '1024' } })
    await user.selectOptions(screen.getByLabelText('Byte unit'), 'B')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const table = await screen.findByTestId('byte-conversion-table')
    expect(within(table).getByText('1')).toBeInTheDocument()
    expect(within(table).getByText('1.024')).toBeInTheDocument()
    expect(within(table).getByText('1024')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('converts decimal input in a binary unit', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('Byte value'), { target: { value: '0.5' } })
    await user.selectOptions(screen.getByLabelText('Byte unit'), 'KiB')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const table = await screen.findByTestId('byte-conversion-table')
    expect(within(table).getByText('512')).toBeInTheDocument()
  })

  it('shows an error for a negative value', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('Byte value'), { target: { value: '-1' } })
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('non-negative')
  })

  it('shows an error for a non-numeric value', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('Byte value'), { target: { value: 'abc' } })
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('valid')
  })

  it('does not report an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText(/Converted values will appear here/)).toBeInTheDocument()
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Byte value')
    fireEvent.change(input, { target: { value: '1024' } })
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(screen.getByTestId('byte-conversion-table')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.queryByTestId('byte-conversion-table')).not.toBeInTheDocument()
  })
})
