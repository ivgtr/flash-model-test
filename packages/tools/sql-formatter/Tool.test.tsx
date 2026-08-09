import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SqlFormatterTool } from './Tool'

function setSqlInput(value: string) {
  fireEvent.change(screen.getByLabelText('SQL input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<SqlFormatterTool />)
  return { user }
}

describe('SqlFormatterTool', () => {
  it('formats SQL input on demand', async () => {
    const { user } = await setup()
    setSqlInput('select id, name from users where id = 1')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    const output = await screen.findByTestId('sql-output')
    expect(output).toHaveTextContent(
      ['SELECT', '  id,', '  name', 'FROM', '  users', 'WHERE', '  id = 1'].join('\n'),
      { normalizeWhitespace: false },
    )
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('preserves string literals and comments in the output', async () => {
    const { user } = await setup()
    setSqlInput("select 'select' as literal, 'it''s' as q from t /* keep */ where id = 1")
    await user.click(screen.getByRole('button', { name: 'Format' }))
    const output = await screen.findByTestId('sql-output')
    expect(output).toHaveTextContent("'select' AS literal", { normalizeWhitespace: false })
    expect(output).toHaveTextContent('/* keep */', { normalizeWhitespace: false })
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Format' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('SQL input')
    setSqlInput('select 1')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Formatted SQL will appear here/)).toBeInTheDocument()
  })
})
