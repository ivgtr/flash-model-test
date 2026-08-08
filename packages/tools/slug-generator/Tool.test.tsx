import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SlugGeneratorTool } from './Tool'

function setSlugInput(value: string) {
  fireEvent.change(screen.getByLabelText('Slug input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<SlugGeneratorTool />)
  return { user }
}

describe('SlugGeneratorTool', () => {
  it('generates a slug on demand', async () => {
    const { user } = await setup()
    setSlugInput('Hello World!')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    const output = await screen.findByTestId('slug-output')
    expect(output).toHaveTextContent('hello-world')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('does not generate before the button is clicked', async () => {
    await setup()
    setSlugInput('Hello World')
    expect(screen.queryByTestId('slug-output')).not.toBeInTheDocument()
  })

  it('shows no slug and no copy button for non-Latin input', async () => {
    const { user } = await setup()
    setSlugInput('日本語のテキスト')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    expect(await screen.findByText(/The generated slug will appear here/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument()
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Slug input')
    setSlugInput('Hello World')
    await user.click(screen.getByRole('button', { name: 'Convert' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/The generated slug will appear here/)).toBeInTheDocument()
  })
})
