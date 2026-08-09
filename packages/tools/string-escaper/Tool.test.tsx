import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { StringEscaperTool } from './Tool'

function setInput(value: string) {
  fireEvent.change(screen.getByLabelText('Text input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<StringEscaperTool />)
  return { user }
}

describe('StringEscaperTool', () => {
  it('escapes user input on demand', async () => {
    const { user } = await setup()
    setInput('<b>hello</b>')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('string-escaper-output')
    expect(output).toHaveTextContent('&lt;b&gt;hello&lt;/b&gt;')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('reflects context switching in the output', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Context'), 'url')
    setInput('a b')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByTestId('string-escaper-output')).toHaveTextContent('a%20b')
  })

  it('reflects direction switching in the output', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Context'), 'url')
    await user.selectOptions(screen.getByLabelText('Direction'), 'unescape')
    setInput('%E3%81%82')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByTestId('string-escaper-output')).toHaveTextContent('あ')
  })

  it('uses the selected JS quote style', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Context'), 'js')
    await user.selectOptions(screen.getByLabelText('Quote style'), 'single')
    setInput("it's")
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByTestId('string-escaper-output')).toHaveTextContent("'it\\'s'")
  })

  it('shows a visible error and no output for invalid unescape input', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Direction'), 'unescape')
    setInput('&bad;')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid HTML entity')
    expect(screen.queryByTestId('string-escaper-output')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument()
  })

  it('disables unescaping for the regex context and explains why', async () => {
    const { user } = await setup()
    const direction = screen.getByLabelText('Direction')
    await user.selectOptions(screen.getByLabelText('Context'), 'regex')
    expect(direction).toBeDisabled()
    expect(screen.getByText(/cannot be unescaped/)).toBeInTheDocument()
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Text input')
    setInput('hello')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Converted text will appear here/)).toBeInTheDocument()
  })
})
