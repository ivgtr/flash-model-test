import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { toolRegistry } from '../app/tool-loader'
import { HomePage } from './HomePage'

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('renders every registered tool as a link to its page', () => {
    renderHomePage()
    const definitions = toolRegistry.list()
    expect(definitions.length).toBeGreaterThan(0)
    for (const definition of definitions) {
      const link = screen.getByRole('link', { name: new RegExp(definition.name) })
      expect(link).toHaveAttribute('href', `/tools/${definition.id}`)
    }
  })

  it('shows the total tool count in the search placeholder', () => {
    renderHomePage()
    expect(screen.getByRole('searchbox')).toHaveAttribute(
      'placeholder',
      `Search ${toolRegistry.size} tools…`,
    )
  })

  it('filters tools by query', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await user.type(screen.getByRole('searchbox'), toolRegistry.list()[0]!.name.slice(0, 3))
    expect(
      screen.getByRole('link', { name: new RegExp(toolRegistry.list()[0]!.name) }),
    ).toBeInTheDocument()
  })

  it('shows an empty state when no tool matches', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await user.type(screen.getByRole('searchbox'), 'zzzz-no-such-tool')
    expect(screen.getByText(/No tools match/)).toBeInTheDocument()
  })
})
