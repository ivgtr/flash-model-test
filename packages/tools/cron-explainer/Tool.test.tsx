import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CronExplainerTool } from './Tool'

function setCronInput(value: string) {
  fireEvent.change(screen.getByLabelText('Cron expression'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<CronExplainerTool />)
  return { user }
}

describe('CronExplainerTool', () => {
  it('explains a cron expression and shows the next run times on demand', async () => {
    const { user } = await setup()
    setCronInput('*/15 9 * * 1-5')
    await user.click(screen.getByRole('button', { name: 'Explain' }))
    expect(await screen.findByTestId('cron-summary')).toHaveTextContent('every 15 minutes')
    const descriptions = screen.getAllByTestId('cron-field-description')
    expect(descriptions).toHaveLength(5)
    expect(descriptions[0]).toHaveTextContent('Every 15 minutes')
    expect(descriptions[4]).toHaveTextContent('On Monday through Friday')
    const runs = await screen.findByTestId('cron-next-runs')
    expect(runs).toBeInTheDocument()
    const runItems = screen.getAllByTestId('cron-next-run')
    expect(runItems).toHaveLength(5)
    for (const item of runItems) {
      expect(item.textContent).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    }
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('shows an error for an invalid cron expression', async () => {
    const { user } = await setup()
    setCronInput('60 * * * *')
    await user.click(screen.getByRole('button', { name: 'Explain' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('out of range')
  })

  it('shows an error for empty input', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Explain' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('input is empty')
  })

  it('reports when no run time exists within 400 days', async () => {
    const { user } = await setup()
    setCronInput('0 0 30 2 *')
    await user.click(screen.getByRole('button', { name: 'Explain' }))
    expect(await screen.findByTestId('cron-no-runs')).toHaveTextContent('within 400 days')
    expect(screen.queryByTestId('cron-next-runs')).not.toBeInTheDocument()
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Cron expression')
    setCronInput('0 9 * * 1-5')
    await user.click(screen.getByRole('button', { name: 'Explain' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Explanation will appear here/)).toBeInTheDocument()
    expect(screen.queryByTestId('cron-field-list')).not.toBeInTheDocument()
  })
})
