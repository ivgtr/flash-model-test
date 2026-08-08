import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ToolPage } from './ToolPage'

function renderToolPage(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/tools/:toolId" element={<ToolPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ToolPage', () => {
  it('renders the tool header from its definition', async () => {
    renderToolPage('/tools/json-formatter')
    expect(await screen.findByRole('heading', { name: 'JSON Formatter' })).toBeInTheDocument()
    expect(screen.getByText('Data')).toBeInTheDocument()
  })

  it('lazily loads the tool and formats JSON end to end', async () => {
    const user = userEvent.setup()
    renderToolPage('/tools/json-formatter')
    const formatButton = await screen.findByRole('button', { name: 'Format' })
    fireEvent.change(screen.getByLabelText('JSON input'), { target: { value: '{"a":1}' } })
    await user.click(formatButton)
    expect(await screen.findByTestId('json-output')).toHaveTextContent('{\n  "a": 1\n}', {
      normalizeWhitespace: false,
    })
  })

  it('shows an error for invalid JSON', async () => {
    const user = userEvent.setup()
    renderToolPage('/tools/json-formatter')
    const formatButton = await screen.findByRole('button', { name: 'Format' })
    fireEvent.change(screen.getByLabelText('JSON input'), { target: { value: '{"a":}' } })
    await user.click(formatButton)
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid JSON')
  })

  it('renders not found for an unknown tool id', async () => {
    renderToolPage('/tools/does-not-exist')
    expect(await screen.findByRole('heading', { name: 'Not found' })).toBeInTheDocument()
  })
})
