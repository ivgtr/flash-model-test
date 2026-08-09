import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { YamlJsonConverterTool } from './Tool'

function setInput(value: string) {
  fireEvent.change(screen.getByLabelText('YAML/JSON input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<YamlJsonConverterTool />)
  return { user }
}

describe('YamlJsonConverterTool', () => {
  it('converts YAML to JSON on demand', async () => {
    const { user } = await setup()
    setInput('name: tool-forge\ncount: 2')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('yaml-output')
    expect(output).toHaveTextContent('"name": "tool-forge"')
    expect(output).toHaveTextContent('"count": 2')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('converts JSON to YAML with the selected direction', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Direction'), 'json-to-yaml')
    setInput('{"name": "tool-forge", "count": 2}')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('yaml-output')
    expect(output).toHaveTextContent('name: tool-forge')
    expect(output).toHaveTextContent('count: 2')
  })

  it('shows an error for unsupported YAML syntax', async () => {
    const { user } = await setup()
    setInput('a: &anchor 1')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Unsupported syntax: anchor')
  })

  it('shows an error for invalid JSON in the JSON direction', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Direction'), 'json-to-yaml')
    setInput('{broken')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid JSON')
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Input is empty')
  })

  it('shows the supported-subset note', () => {
    render(<YamlJsonConverterTool />)
    expect(screen.getByText(/Supported YAML subset/)).toBeInTheDocument()
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('YAML/JSON input')
    setInput('a: 1')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Converted text will appear here/)).toBeInTheDocument()
  })
})
