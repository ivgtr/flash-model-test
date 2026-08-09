import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SubnetCalculatorTool } from './Tool'

async function setup() {
  const user = userEvent.setup()
  render(<SubnetCalculatorTool />)
  return { user }
}

describe('SubnetCalculatorTool', () => {
  it('displays subnet results for an IP and CIDR prefix', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('IP address'), {
      target: { value: '192.168.1.129' },
    })
    fireEvent.change(screen.getByLabelText('Prefix'), { target: { value: '25' } })
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(await screen.findByTestId('subnet-network')).toHaveTextContent('192.168.1.128')
    expect(screen.getByTestId('subnet-broadcast')).toHaveTextContent('192.168.1.255')
    expect(screen.getByTestId('subnet-first')).toHaveTextContent('192.168.1.129')
    expect(screen.getByTestId('subnet-last')).toHaveTextContent('192.168.1.254')
    expect(screen.getByTestId('subnet-usable-hosts')).toHaveTextContent('126')
    expect(screen.getByTestId('subnet-total-addresses')).toHaveTextContent('128')
    expect(screen.getByTestId('subnet-mask-dotted')).toHaveTextContent('255.255.255.128')
    expect(screen.getByTestId('subnet-mask-binary')).toHaveTextContent(
      '11111111.11111111.11111111.10000000',
    )
    expect(screen.getByTestId('subnet-mask-cidr')).toHaveTextContent('/25')
    expect(screen.getByTestId('subnet-wildcard')).toHaveTextContent('0.0.0.127')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('accepts a dotted subnet mask as input', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('IP address'), {
      target: { value: '10.1.2.3' },
    })
    await user.selectOptions(screen.getByLabelText('Prefix type'), 'mask')
    fireEvent.change(screen.getByLabelText('Subnet mask'), {
      target: { value: '255.255.255.0' },
    })
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(await screen.findByTestId('subnet-network')).toHaveTextContent('10.1.2.0')
    expect(screen.getByTestId('subnet-mask-cidr')).toHaveTextContent('/24')
    expect(screen.getByTestId('subnet-broadcast')).toHaveTextContent('10.1.2.255')
  })

  it('shows an error for an invalid IP address', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('IP address'), {
      target: { value: '999.1.1.1' },
    })
    fireEvent.change(screen.getByLabelText('Prefix'), { target: { value: '24' } })
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid IP address')
  })

  it('shows an error for a non-contiguous mask', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('IP address'), {
      target: { value: '192.168.1.1' },
    })
    await user.selectOptions(screen.getByLabelText('Prefix type'), 'mask')
    fireEvent.change(screen.getByLabelText('Subnet mask'), {
      target: { value: '255.255.255.1' },
    })
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('contiguous')
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('clears inputs and output', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('IP address'), {
      target: { value: '192.168.1.1' },
    })
    fireEvent.change(screen.getByLabelText('Prefix'), { target: { value: '24' } })
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    expect(await screen.findByTestId('subnet-output')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByLabelText('IP address')).toHaveValue('')
    expect(screen.getByLabelText('Prefix')).toHaveValue('')
    expect(screen.queryByTestId('subnet-output')).not.toBeInTheDocument()
    expect(screen.getByText(/Subnet details will appear here/)).toBeInTheDocument()
  })
})
