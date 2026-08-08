import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HtmlEscapeTool } from './Tool'

function setInput(value: string) {
  fireEvent.change(screen.getByLabelText('HTML text input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<HtmlEscapeTool />)
  return { user }
}

describe('HtmlEscapeTool', () => {
  it('escapes user input on demand', async () => {
    const { user } = await setup()
    setInput('<a href="x">A & B</a>')
    await user.click(screen.getByRole('button', { name: 'Escape' }))
    const output = await screen.findByTestId('html-escape-output')
    expect(output).toHaveTextContent('&lt;a href=&quot;x&quot;&gt;A &amp; B&lt;/a&gt;')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('unescapes user input when direction is unescape', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Direction'), 'unescape')
    setInput('&lt;p&gt;It&#39;s 5 &amp; 6&lt;/p&gt;')
    await user.click(screen.getByRole('button', { name: 'Unescape' }))
    const output = await screen.findByTestId('html-escape-output')
    expect(output).toHaveTextContent("<p>It's 5 & 6</p>")
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('HTML text input')
    setInput('a & b')
    await user.click(screen.getByRole('button', { name: 'Escape' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Converted text will appear here/)).toBeInTheDocument()
  })
})
