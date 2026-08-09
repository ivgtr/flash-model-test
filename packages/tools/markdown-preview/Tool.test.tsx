import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MarkdownPreviewTool } from './Tool'

function setMarkdownInput(value: string) {
  fireEvent.change(screen.getByLabelText('Markdown input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  const { container } = render(<MarkdownPreviewTool />)
  return { user, container }
}

describe('MarkdownPreviewTool', () => {
  it('renders a preview when the user enters Markdown', async () => {
    const { user } = await setup()
    setMarkdownInput('# Title\n\n**bold** and `code`')
    await user.click(screen.getByRole('button', { name: 'Render' }))
    const preview = await screen.findByTestId('markdown-preview')
    expect(preview).toHaveTextContent('Title')
    expect(preview).toHaveTextContent('bold')
    expect(preview).toHaveTextContent('code')
    expect(screen.getByRole('button', { name: 'Copy HTML' })).toBeEnabled()
  })

  it('escapes raw HTML instead of executing it', async () => {
    const { user, container } = await setup()
    setMarkdownInput('<script>alert(1)</script>')
    await user.click(screen.getByRole('button', { name: 'Render' }))
    await screen.findByTestId('markdown-preview')
    expect(container.querySelector('script')).toBeNull()
    expect(screen.getByTestId('markdown-preview')).toHaveTextContent('<script>alert(1)</script>')
  })

  it('shows an empty preview for empty input without an error', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Render' }))
    const preview = await screen.findByTestId('markdown-preview')
    expect(preview).toHaveTextContent('Nothing to preview')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('displays the supported subset note', () => {
    render(<MarkdownPreviewTool />)
    const note = screen.getByTestId('supported-subset')
    expect(note).toHaveTextContent('subset')
    expect(note).toHaveTextContent('literal')
    expect(note).toHaveTextContent('headings')
  })

  it('clears input and preview', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Markdown input')
    setMarkdownInput('# Hi')
    await user.click(screen.getByRole('button', { name: 'Render' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Rendered HTML will appear here/)).toBeInTheDocument()
  })
})
