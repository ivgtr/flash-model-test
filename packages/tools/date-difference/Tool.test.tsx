import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DateDifferenceTool } from './Tool'

function setDatetime(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<DateDifferenceTool />)
  return { user }
}

describe('DateDifferenceTool', () => {
  it('shows the difference when both inputs are given', async () => {
    const { user } = await setup()
    setDatetime('Start', '2024-01-15T10:30')
    setDatetime('End', '2024-01-16T10:30')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    const result = await screen.findByTestId('date-difference-result')
    expect(result).toHaveTextContent('0 年 0 ヶ月 1 日')
    expect(result).toHaveTextContent('24 時間')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('shows all zeros for identical datetimes', async () => {
    const { user } = await setup()
    setDatetime('Start', '2024-06-15T08:00')
    setDatetime('End', '2024-06-15T08:00')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    const result = await screen.findByTestId('date-difference-result')
    expect(result).toHaveTextContent('0 年 0 ヶ月 0 日')
    expect(result).toHaveTextContent('0 時間')
  })

  it('shows an error when only one input is given', async () => {
    const { user } = await setup()
    setDatetime('Start', '2024-01-15T10:30')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Both start and end are required')
  })

  it('shows nothing for empty inputs', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    expect(screen.getByText(/Difference will appear here/)).toBeInTheDocument()
    expect(screen.queryByTestId('date-difference-result')).not.toBeInTheDocument()
  })

  it('clears inputs and output', async () => {
    const { user } = await setup()
    const start = screen.getByLabelText('Start')
    const end = screen.getByLabelText('End')
    setDatetime('Start', '2024-01-15T10:30')
    setDatetime('End', '2024-01-16T10:30')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    await screen.findByTestId('date-difference-result')
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(start).toHaveValue('')
    expect(end).toHaveValue('')
    expect(screen.getByText(/Difference will appear here/)).toBeInTheDocument()
  })
})
