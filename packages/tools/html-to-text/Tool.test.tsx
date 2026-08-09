import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HtmlToTextTool } from './Tool'

function setHtmlInput(value: string) {
  fireEvent.change(screen.getByLabelText('HTML input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<HtmlToTextTool />)
  return { user }
}

describe('HtmlToTextTool', () => {
  it('converts HTML input to plain text on demand', async () => {
    const { user } = await setup()
    setHtmlInput('<h1>Title</h1><p>Hello <b>world</b>!<br>Second line</p>')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('html-to-text-output')
    expect(output).toHaveTextContent('Title\nHello world!\nSecond line', {
      normalizeWhitespace: false,
    })
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('shows an error when input contains only whitespace', async () => {
    const { user } = await setup()
    setHtmlInput('   \n\t ')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('HTML input')
    setHtmlInput('<p>Hello</p>')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Plain text will appear here/)).toBeInTheDocument()
  })
})
