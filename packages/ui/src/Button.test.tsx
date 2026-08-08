import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders with default type button and primary variant', () => {
    render(<Button>Run</Button>)
    const button = screen.getByRole('button', { name: 'Run' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button.className).toContain('primary')
  })

  it('applies the requested variant', () => {
    render(<Button variant="danger">Delete</Button>)
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('danger')
  })

  it('fires onClick', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Run</Button>)
    await user.click(screen.getByRole('button', { name: 'Run' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Button disabled>Run</Button>)
    expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled()
  })
})
