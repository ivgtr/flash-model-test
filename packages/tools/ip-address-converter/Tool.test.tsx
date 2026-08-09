import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { IpAddressConverterTool } from './Tool'

function setAddressInput(value: string) {
  fireEvent.change(screen.getByLabelText('IP address input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<IpAddressConverterTool />)
  return { user }
}

describe('IpAddressConverterTool', () => {
  it('converts an IPv4 dotted address to integer, binary, and hex', async () => {
    const { user } = await setup()
    setAddressInput('192.168.0.1')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByTestId('dotted')).toHaveTextContent('192.168.0.1')
    expect(screen.getByTestId('int')).toHaveTextContent('3232235521')
    expect(screen.getByTestId('bin')).toHaveTextContent('11000000101010000000000000000001')
    expect(screen.getByTestId('hex')).toHaveTextContent('c0a80001')
    expect(screen.getByRole('button', { name: 'Copy Hex' })).toBeEnabled()
  })

  it('accepts integer and hex IPv4 inputs', async () => {
    const { user } = await setup()
    setAddressInput('3232235521')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByTestId('dotted')).toHaveTextContent('192.168.0.1')

    setAddressInput('0xc0a80001')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByTestId('dotted')).toHaveTextContent('192.168.0.1')
  })

  it('expands and compresses an IPv6 address', async () => {
    const { user } = await setup()
    setAddressInput('2001:0db8:0000:0000:0000:ff00:0042:8329')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByTestId('compressed')).toHaveTextContent('2001:db8::ff00:42:8329')
    expect(screen.getByTestId('expanded')).toHaveTextContent(
      '2001:0db8:0000:0000:0000:ff00:0042:8329',
    )
    expect(screen.getByRole('button', { name: 'Copy Compressed' })).toBeEnabled()
  })

  it('expands an IPv4-mapped IPv6 address', async () => {
    const { user } = await setup()
    setAddressInput('::ffff:192.168.0.1')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByTestId('expanded')).toHaveTextContent(
      '0000:0000:0000:0000:0000:ffff:c0a8:0001',
    )
  })

  it('uses the selected address family', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Address family'), 'IPv4')
    setAddressInput('192.168.0.1')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByTestId('dotted')).toHaveTextContent('192.168.0.1')

    await user.selectOptions(screen.getByLabelText('Address family'), 'IPv6')
    setAddressInput('192.168.0.1')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('expected exactly 8 groups')
  })

  it('shows an error for an invalid IPv4 address', async () => {
    const { user } = await setup()
    setAddressInput('192.168.001.1')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('leading zeros')
  })

  it('shows an error for an invalid IPv6 address', async () => {
    const { user } = await setup()
    setAddressInput('2001:db8::1::2')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('at most once')
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('IP address input')
    setAddressInput('192.168.0.1')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Converted address will appear here/)).toBeInTheDocument()
  })
})
