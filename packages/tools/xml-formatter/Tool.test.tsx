import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { XmlFormatterTool } from './Tool'

function setXmlInput(value: string) {
  fireEvent.change(screen.getByLabelText('XML input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<XmlFormatterTool />)
  return { user }
}

describe('XmlFormatterTool', () => {
  it('formats XML input on demand', async () => {
    const { user } = await setup()
    setXmlInput('<root><item>one</item><item>two</item></root>')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    const output = await screen.findByTestId('xml-output')
    expect(output).toHaveTextContent(
      ['<root>', '  <item>one</item>', '  <item>two</item>', '</root>'].join('\n'),
      { normalizeWhitespace: false },
    )
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('uses the selected indent width', async () => {
    const { user } = await setup()
    setXmlInput('<a><b><c>x</c></b></a>')
    await user.selectOptions(screen.getByLabelText('Indent'), '4')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    const output = await screen.findByTestId('xml-output')
    expect(output).toHaveTextContent(
      ['<a>', '    <b>', '        <c>x</c>', '    </b>', '</a>'].join('\n'),
      { normalizeWhitespace: false },
    )
  })

  it('shows an error for invalid XML', async () => {
    const { user } = await setup()
    setXmlInput('<a><b></a>')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid XML')
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Format' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('XML input')
    setXmlInput('<a/>')
    await user.click(screen.getByRole('button', { name: 'Format' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Formatted XML will appear here/)).toBeInTheDocument()
  })
})
