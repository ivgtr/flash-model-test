import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HashGeneratorTool } from './Tool'

function setTextInput(value: string) {
  fireEvent.change(screen.getByLabelText('Text input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<HashGeneratorTool />)
  return { user }
}

describe('HashGeneratorTool', () => {
  it('shows the result after the user types and presses Hash', async () => {
    const { user } = await setup()
    setTextInput('abc')
    await user.click(screen.getByRole('button', { name: 'Hash' }))
    const output = await screen.findByTestId('hash-output')
    expect(output).toHaveTextContent(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('hashes the empty string without error', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Hash' }))
    const output = await screen.findByTestId('hash-output')
    expect(output).toHaveTextContent(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
  })

  it('switches the algorithm and recomputes', async () => {
    const { user } = await setup()
    setTextInput('abc')
    const select = screen.getByLabelText('Algorithm')
    expect(select).toHaveValue('SHA-256')

    await user.selectOptions(select, 'SHA-1')
    await user.click(screen.getByRole('button', { name: 'Hash' }))
    const output = await screen.findByTestId('hash-output')
    expect(output).toHaveTextContent('a9993e364706816aba3e25717850c26c9cd0d89d')

    await user.selectOptions(select, 'SHA-512')
    await user.click(screen.getByRole('button', { name: 'Hash' }))
    expect(await screen.findByTestId('hash-output')).toHaveTextContent(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    )
  })

  it('enables the Copy button once a result is shown', async () => {
    const { user } = await setup()
    setTextInput('abc')
    await user.click(screen.getByRole('button', { name: 'Hash' }))
    await screen.findByTestId('hash-output')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('clears input and result', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Text input')
    setTextInput('abc')
    await user.click(screen.getByRole('button', { name: 'Hash' }))
    await screen.findByTestId('hash-output')
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/The hash will appear here/)).toBeInTheDocument()
    expect(screen.queryByTestId('hash-output')).not.toBeInTheDocument()
  })
})
