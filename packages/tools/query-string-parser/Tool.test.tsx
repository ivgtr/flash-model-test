import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { QueryStringParserTool } from './Tool'

async function setup() {
  const user = userEvent.setup()
  render(<QueryStringParserTool />)
  return { user }
}

describe('QueryStringParserTool', () => {
  it('shows parsed pairs for user input', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('Query string input'), {
      target: { value: '?a=1&b=2' },
    })
    await user.click(screen.getByRole('button', { name: 'Parse' }))
    const pairs = await screen.findByTestId('query-pairs')
    expect(pairs).toHaveTextContent('a')
    expect(pairs).toHaveTextContent('1')
    expect(pairs).toHaveTextContent('b')
    expect(pairs).toHaveTextContent('2')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('shows a visible error message for malformed encoding', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('Query string input'), {
      target: { value: 'a=%zz' },
    })
    await user.click(screen.getByRole('button', { name: 'Parse' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid percent-encoding')
    expect(screen.queryByTestId('query-pairs')).not.toBeInTheDocument()
  })

  it('serializes an editable pair list into a query string', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Mode'), 'serialize')
    fireEvent.change(screen.getByLabelText('Key 1'), { target: { value: 'a' } })
    fireEvent.change(screen.getByLabelText('Value 1'), { target: { value: '1' } })
    await user.click(screen.getByRole('button', { name: 'Add pair' }))
    fireEvent.change(screen.getByLabelText('Key 2'), { target: { value: 'b' } })
    fireEvent.change(screen.getByLabelText('Value 2'), { target: { value: 'こんにちは' } })
    await user.click(screen.getByRole('button', { name: 'Serialize' }))
    const output = await screen.findByTestId('query-string-output')
    expect(output).toHaveTextContent('a=1&b=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('removes a pair from the list', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Mode'), 'serialize')
    await user.click(screen.getByRole('button', { name: 'Add pair' }))
    const buttons = screen.getAllByRole('button', { name: 'Remove' })
    const secondPairSection = buttons[0]!.closest('li')!
    await user.click(within(secondPairSection).getByRole('button', { name: 'Remove' }))
    expect(screen.getByLabelText('Key 1')).toBeInTheDocument()
    expect(screen.queryByLabelText('Key 2')).not.toBeInTheDocument()
  })
})
