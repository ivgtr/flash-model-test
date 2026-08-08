import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { UUID_V4_PATTERN } from './logic'
import { UuidGeneratorTool } from './Tool'

const UPPERCASE_UUID_PATTERN =
  /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/

async function setup() {
  const user = userEvent.setup()
  render(<UuidGeneratorTool />)
  return { user }
}

function setCount(value: string) {
  fireEvent.change(screen.getByLabelText('Count'), { target: { value } })
}

function getFirstUuid(): string | undefined {
  return screen.getByTestId('uuid-output').querySelector('code')?.textContent ?? undefined
}

describe('UuidGeneratorTool', () => {
  it('shows nothing in the output before generating', () => {
    render(<UuidGeneratorTool />)
    expect(screen.queryByTestId('uuid-output')).not.toBeInTheDocument()
    expect(screen.getByText('Generated UUIDs will appear here.')).toBeInTheDocument()
  })

  it('generates a UUID when Generate is pressed', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Generate' }))
    expect(await screen.findByTestId('uuid-output')).toBeInTheDocument()
    expect(getFirstUuid()).toMatch(UUID_V4_PATTERN)
  })

  it('generates the requested number of UUIDs', async () => {
    const { user } = await setup()
    setCount('10')
    await user.click(screen.getByRole('button', { name: 'Generate' }))
    const output = await screen.findByTestId('uuid-output')
    expect(output.querySelectorAll('code')).toHaveLength(10)
  })

  it('generates uppercase UUIDs when Uppercase is selected', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Case'), 'upper')
    await user.click(screen.getByRole('button', { name: 'Generate' }))
    expect(await screen.findByTestId('uuid-output')).toBeInTheDocument()
    expect(getFirstUuid()).toMatch(UPPERCASE_UUID_PATTERN)
  })

  it('shows an error when the count is invalid', async () => {
    const { user } = await setup()
    setCount('0')
    await user.click(screen.getByRole('button', { name: 'Generate' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Count must be an integer between 1 and 100.',
    )
    expect(screen.queryByTestId('uuid-output')).not.toBeInTheDocument()
  })

  it('shows an error for a non-numeric count', async () => {
    const { user } = await setup()
    setCount('abc')
    await user.click(screen.getByRole('button', { name: 'Generate' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Count must be an integer')
  })

  it('enables the copy buttons after generating', async () => {
    const { user } = await setup()
    expect(screen.queryAllByRole('button', { name: /Copy/ })).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Generate' }))
    const copyButtons = await screen.findAllByRole('button', { name: /Copy/ })
    expect(copyButtons.length).toBeGreaterThanOrEqual(2)
    for (const button of copyButtons) {
      expect(button).toBeEnabled()
    }
  })
})
