import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { QueryStringBuilderTool } from './Tool'

async function setup() {
  const user = userEvent.setup()
  render(<QueryStringBuilderTool />)
  return { user }
}

describe('QueryStringBuilderTool', () => {
  it('lets the user add rows and assembles the query string', async () => {
    const { user } = await setup()
    const output = screen.getByTestId('query-string-output')
    expect(output).toHaveTextContent('')

    await user.type(screen.getByLabelText('Key 1'), 'a')
    await user.type(screen.getByLabelText('Value 1'), '1')
    expect(output).toHaveTextContent('a=1')

    await user.click(screen.getByRole('button', { name: 'Add row' }))
    await user.type(screen.getByLabelText('Key 2'), 'q')
    await user.type(screen.getByLabelText('Value 2'), 'hello world')
    expect(output).toHaveTextContent('a=1&q=hello+world')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('removes rows and imports a pasted query string', async () => {
    const { user } = await setup()
    const output = screen.getByTestId('query-string-output')

    await user.type(screen.getByLabelText('Key 1'), 'a')
    await user.type(screen.getByLabelText('Value 1'), '1')
    await user.click(screen.getByRole('button', { name: 'Add row' }))
    await user.type(screen.getByLabelText('Key 2'), 'b')
    await user.type(screen.getByLabelText('Value 2'), '2')
    expect(output).toHaveTextContent('a=1&b=2')

    await user.click(screen.getByRole('button', { name: 'Remove row 2' }))
    expect(output).toHaveTextContent('a=1')

    await user.type(screen.getByLabelText('Query string'), '?x=2&y=3')
    await user.click(screen.getByRole('button', { name: 'Import' }))
    expect(output).toHaveTextContent('x=2&y=3')
    expect(screen.getByLabelText('Key 1')).toHaveValue('x')
    expect(screen.getByLabelText('Value 2')).toHaveValue('3')
  })

  it('ignores a row that has only a value', async () => {
    const { user } = await setup()
    const output = screen.getByTestId('query-string-output')
    await user.type(screen.getByLabelText('Value 1'), 'orphan')
    expect(output).toHaveTextContent('')
    expect(screen.getByText('Query string will appear here.')).toBeInTheDocument()
  })

  it('clears all rows', async () => {
    const { user } = await setup()
    const output = screen.getByTestId('query-string-output')
    await user.type(screen.getByLabelText('Key 1'), 'a')
    await user.type(screen.getByLabelText('Value 1'), '1')
    expect(output).toHaveTextContent('a=1')
    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(output).toHaveTextContent('')
    expect(screen.getByText('No pairs. Add a row or import a query string.')).toBeInTheDocument()
  })
})
