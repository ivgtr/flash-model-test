import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HttpStatusReferenceTool } from './Tool'

async function setup() {
  const user = userEvent.setup()
  render(<HttpStatusReferenceTool />)
  return { user }
}

function tableRows() {
  return screen.getByTestId('status-code-table').querySelectorAll('tbody tr')
}

describe('HttpStatusReferenceTool', () => {
  it('shows the full list of status codes by default', async () => {
    await setup()
    expect(await screen.findByTestId('status-code-table')).toBeInTheDocument()
    expect(screen.queryByTestId('no-results')).not.toBeInTheDocument()
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Not Found')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
  })

  it('filters results as the user types a search query', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('Search status codes'), 'teapot')
    expect(await screen.findByTestId('status-code-table')).toBeInTheDocument()
    expect(tableRows()).toHaveLength(1)
    expect(screen.getByText("I'm a Teapot")).toBeInTheDocument()
  })

  it('searches by code number', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('Search status codes'), '404')
    expect(await screen.findByTestId('status-code-table')).toBeInTheDocument()
    expect(tableRows()).toHaveLength(1)
    expect(screen.getByText('Not Found')).toBeInTheDocument()
  })

  it('searches by name ignoring case', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('Search status codes'), 'NOT FOUND')
    expect(await screen.findByTestId('status-code-table')).toBeInTheDocument()
    expect(tableRows()).toHaveLength(1)
  })

  it('shows a message when no results match', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('Search status codes'), 'nonexistent-code')
    expect(await screen.findByTestId('no-results')).toHaveTextContent(/no results/i)
    expect(screen.queryByTestId('status-code-table')).not.toBeInTheDocument()
  })

  it('filters by category', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Category'), '5xx')
    expect(await screen.findByTestId('status-code-table')).toBeInTheDocument()
    const rows = tableRows()
    expect(rows.length).toBeGreaterThan(0)
    for (const row of Array.from(rows)) {
      expect(row.textContent).toContain('5xx Server Error')
    }
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument()
    expect(screen.queryByText('Not Found')).not.toBeInTheDocument()
  })

  it('combines category filter with a search query', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('Search status codes'), 'not found')
    await user.selectOptions(screen.getByLabelText('Category'), '5xx')
    expect(await screen.findByTestId('no-results')).toHaveTextContent(/no results/i)
    await user.selectOptions(screen.getByLabelText('Category'), '4xx')
    expect(await screen.findByTestId('status-code-table')).toBeInTheDocument()
    expect(tableRows()).toHaveLength(1)
  })

  it('clearing the search restores the full list', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Search status codes')
    await user.type(input, 'teapot')
    expect(await screen.findByTestId('status-code-table')).toBeInTheDocument()
    expect(tableRows()).toHaveLength(1)
    await user.clear(input)
    expect(await screen.findByTestId('status-code-table')).toBeInTheDocument()
    expect(tableRows().length).toBeGreaterThan(1)
  })
})
