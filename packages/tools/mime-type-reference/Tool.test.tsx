import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MimeTypeReferenceTool } from './Tool'

async function setup() {
  const user = userEvent.setup()
  render(<MimeTypeReferenceTool />)
  return { user }
}

describe('MimeTypeReferenceTool', () => {
  it('shows the full list of MIME types on first render', async () => {
    await setup()
    expect(screen.getByText('text/plain')).toBeInTheDocument()
    expect(screen.getByText('image/png')).toBeInTheDocument()
    expect(screen.getByText('137 entries')).toBeInTheDocument()
  })

  it('filters results as the user types a search query', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('Search MIME types'), 'png')
    expect(screen.getByText('image/png')).toBeInTheDocument()
    expect(screen.queryByText('text/plain')).not.toBeInTheDocument()
  })

  it('accepts a search query with a leading dot', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('Search MIME types'), '.js')
    expect(screen.getByText('application/javascript')).toBeInTheDocument()
    expect(screen.getByText('text/javascript')).toBeInTheDocument()
  })

  it('filters by category', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Category'), 'font')
    expect(screen.getByText('font/ttf')).toBeInTheDocument()
    expect(screen.getByText('font/woff2')).toBeInTheDocument()
    expect(screen.queryByText('image/png')).not.toBeInTheDocument()
  })

  it('combines the search query with the category filter', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('Search MIME types'), 'woff2')
    await user.selectOptions(screen.getByLabelText('Category'), 'font')
    expect(screen.getByText('font/woff2')).toBeInTheDocument()
    expect(screen.queryByText('font/ttf')).not.toBeInTheDocument()
  })

  it('shows a no-results message when nothing matches', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('Search MIME types'), 'zzzz')
    expect(screen.getByRole('status')).toHaveTextContent(/no results/i)
  })

  it('clears the search query and category filter', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Search MIME types')
    await user.type(input, 'png')
    await user.selectOptions(screen.getByLabelText('Category'), 'image')
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByLabelText('Category')).toHaveValue('all')
    expect(screen.getByText('text/plain')).toBeInTheDocument()
    expect(screen.getByText('image/png')).toBeInTheDocument()
  })
})
