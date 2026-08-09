import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PasswordStrengthCheckerTool } from './Tool'

async function setup() {
  const user = userEvent.setup()
  render(<PasswordStrengthCheckerTool />)
  return { user }
}

describe('PasswordStrengthCheckerTool', () => {
  it('shows score, checklist, and entropy for a typed password', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('Password input'), 'Tr0ub4dor&3X')
    expect(screen.getByTestId('password-score')).toHaveTextContent('4 / 4')
    expect(screen.getByTestId('password-score')).toHaveTextContent('Strong')
    const checks = screen.getByTestId('password-checks')
    expect(checks.children).toHaveLength(7)
    expect(checks).toHaveTextContent('At least 8 characters')
    expect(checks).toHaveTextContent('At least 12 characters')
    expect(checks).toHaveTextContent('Contains an uppercase letter')
    expect(checks).toHaveTextContent('Contains a lowercase letter')
    expect(checks).toHaveTextContent('Contains a digit')
    expect(checks).toHaveTextContent('Contains a symbol')
    expect(checks).toHaveTextContent('Few repeated or sequential characters')
    expect(screen.getByTestId('password-entropy')).toHaveTextContent('78.8 bits')
  })

  it('updates the score live as the password changes', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Password input')
    await user.type(input, 'password')
    expect(screen.getByTestId('password-score')).toHaveTextContent('2 / 4')
    expect(screen.getByTestId('password-score')).toHaveTextContent('Fair')
    await user.clear(input)
    await user.type(input, 'Tr0ub4dor&3X')
    expect(screen.getByTestId('password-score')).toHaveTextContent('4 / 4')
    expect(screen.getByTestId('password-score')).toHaveTextContent('Strong')
  })

  it('marks checklist items as failed for a weak password', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('Password input'), 'aaaa')
    const score = screen.getByTestId('password-score')
    expect(score).toHaveTextContent('0 / 4')
    expect(score).toHaveTextContent('Very Weak')
    const checks = screen.getByTestId('password-checks')
    const failed = Array.from(checks.querySelectorAll('[data-passed="false"]'))
    const passed = Array.from(checks.querySelectorAll('[data-passed="true"]'))
    expect(passed).toHaveLength(1)
    expect(failed).toHaveLength(6)
  })

  it('clears the analysis when the clear button is pressed', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Password input')
    await user.type(input, 'Tr0ub4dor&3X')
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByTestId('password-score')).toHaveTextContent('0 / 4')
    expect(screen.getByTestId('password-entropy')).toHaveTextContent('0 bits')
  })

  it('states that processing happens only in the browser without a dictionary', () => {
    render(<PasswordStrengthCheckerTool />)
    expect(screen.getByText(/processed only in your browser/i)).toBeInTheDocument()
    expect(screen.getByText(/no common-password dictionary is used/i)).toBeInTheDocument()
  })
})
