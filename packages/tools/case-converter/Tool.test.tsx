import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CaseConverterTool } from './Tool'

function setInput(value: string) {
  fireEvent.change(screen.getByLabelText('Text input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<CaseConverterTool />)
  return { user }
}

describe('CaseConverterTool', () => {
  it('converts the input to the selected target case', async () => {
    const { user } = await setup()
    setInput('foo_bar baz')
    await user.selectOptions(screen.getByLabelText('Target case'), 'PascalCase')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByTestId('case-output')).toHaveTextContent('FooBarBaz')
  })

  it('shows the converted result and enables the Copy button', async () => {
    const { user } = await setup()
    setInput('hello-world')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('case-output')
    expect(output).toHaveTextContent('helloWorld')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('shows a placeholder before any conversion', () => {
    render(<CaseConverterTool />)
    expect(screen.getByText(/Converted text will appear here/)).toBeInTheDocument()
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Text input')
    setInput('foo-bar')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Converted text will appear here/)).toBeInTheDocument()
  })
})
