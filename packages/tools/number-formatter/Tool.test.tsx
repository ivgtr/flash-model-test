import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { NumberFormatterTool } from './Tool'

async function setup() {
  const user = userEvent.setup()
  render(<NumberFormatterTool />)
  return { user }
}

function setNumberInput(value: string) {
  fireEvent.change(screen.getByLabelText('Number input'), { target: { value } })
}

async function formatWithDefaultOptions(user: ReturnType<typeof userEvent.setup>, value: string) {
  setNumberInput(value)
  await user.click(screen.getByRole('button', { name: 'Format' }))
  return screen.findByTestId('number-output')
}

describe('NumberFormatterTool', () => {
  it('formats a number with the default options', async () => {
    const { user } = await setup()
    const output = await formatWithDefaultOptions(user, '1234.5')
    expect(output).toHaveTextContent('1,234.5')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('reflects a locale change', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Locale'), 'de-DE')
    const output = await formatWithDefaultOptions(user, '1234.5')
    expect(output).toHaveTextContent('1.234,5')
  })

  it('reflects a style change to percent', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Style'), 'percent')
    const output = await formatWithDefaultOptions(user, '0.25')
    expect(output).toHaveTextContent('25%')
  })

  it('reflects a currency selection in currency style', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Style'), 'currency')
    await user.selectOptions(screen.getByLabelText('Currency'), 'JPY')
    const output = await formatWithDefaultOptions(user, '42')
    expect(output).toHaveTextContent('¥42')
  })

  it('applies the selected maximum fraction digits', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Max fraction digits'), '2')
    const output = await formatWithDefaultOptions(user, '3.14159')
    expect(output).toHaveTextContent('3.14')
  })

  it('applies the selected minimum fraction digits', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Min fraction digits'), '2')
    const output = await formatWithDefaultOptions(user, '3.1')
    expect(output).toHaveTextContent('3.10')
  })

  it('disables grouping when unchecked', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('checkbox', { name: 'Group thousands' }))
    const output = await formatWithDefaultOptions(user, '1234.5')
    expect(output).toHaveTextContent('1234.5')
  })

  it('adds a prefix and suffix to the formatted output', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('Prefix'), 'Total: ')
    await user.type(screen.getByLabelText('Suffix'), ' USD')
    const output = await formatWithDefaultOptions(user, '1234.5')
    expect(output).toHaveTextContent('Total: 1,234.5 USD')
  })

  it('shows an error for invalid input', async () => {
    const { user } = await setup()
    setNumberInput('abc')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid number')
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Format' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('clears input, options state, and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Number input')
    setNumberInput('0.25')
    await user.selectOptions(screen.getByLabelText('Style'), 'percent')
    await user.type(screen.getByLabelText('Prefix'), 'P')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    expect(screen.getByTestId('number-output')).toHaveTextContent('25%')
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Formatted number will appear here/)).toBeInTheDocument()
    expect(screen.queryByTestId('number-output')).not.toBeInTheDocument()
  })
})
