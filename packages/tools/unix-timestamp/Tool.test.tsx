import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { serializeToolState } from '@tool-forge/core'
import { UnixTimestampTool } from './Tool'
import { unixTimestampStateCodec } from './state'

async function setup() {
  const user = userEvent.setup()
  render(<UnixTimestampTool />)
  return { user }
}

function convertButtonFor(sectionTitle: string) {
  const section = screen.getByRole('heading', { name: sectionTitle }).closest('section')!
  return within(section).getByRole('button', { name: 'Convert' })
}

describe('UnixTimestampTool', () => {
  it('shows the converted date for a timestamp input', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('Timestamp input'), { target: { value: '0' } })
    await user.click(convertButtonFor('Timestamp to Date'))
    const result = await screen.findByTestId('timestamp-result')
    expect(result).toHaveTextContent('1970-01-01 00:00:00')
    expect(result).toHaveTextContent('Local time')
    expect(result).toHaveTextContent('UTC time')
    expect(screen.getAllByRole('button', { name: 'Copy' }).length).toBe(4)
  })

  it('shows a visible error message for an invalid timestamp', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('Timestamp input'), { target: { value: 'abc' } })
    await user.click(convertButtonFor('Timestamp to Date'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid timestamp')
    expect(screen.queryByTestId('timestamp-result')).not.toBeInTheDocument()
  })

  it('converts a datetime input to a timestamp in seconds', async () => {
    const { user } = await setup()
    fireEvent.change(screen.getByLabelText('Date input'), {
      target: { value: '2026-08-09T10:30' },
    })
    await user.click(convertButtonFor('Date to Timestamp'))
    const result = await screen.findByTestId('timestamp-result')
    const expected = Math.floor(new Date('2026-08-09T10:30').getTime() / 1000)
    expect(result).toHaveTextContent(expected.toString())
  })

  it('shows a visible error message for an empty date input', async () => {
    const { user } = await setup()
    await user.click(convertButtonFor('Date to Timestamp'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a date and time first.')
  })

  it('restores both inputs from a shared URL and recomputes both results', () => {
    const state = { timestamp: '0', date: '2026-08-09T10:30' }
    const serialized = serializeToolState(state, unixTimestampStateCodec)
    expect(serialized).not.toBeNull()
    window.history.replaceState({}, '', `/tools/unix-timestamp?s=${serialized!}`)
    render(<UnixTimestampTool />)
    expect(screen.getByLabelText('Timestamp input')).toHaveValue('0')
    expect(screen.getByLabelText('Date input')).toHaveValue('2026-08-09T10:30')
    const results = screen.getAllByTestId('timestamp-result')
    expect(results).toHaveLength(2)
    expect(results[0]).toHaveTextContent('1970-01-01 00:00:00')
    const expected = Math.floor(new Date('2026-08-09T10:30').getTime() / 1000)
    expect(results[1]).toHaveTextContent(expected.toString())
  })

  it('falls back to defaults for a malformed state URL', () => {
    window.history.replaceState({}, '', '/tools/unix-timestamp?s=1.garbage!!!')
    render(<UnixTimestampTool />)
    expect(screen.getByLabelText('Timestamp input')).toHaveValue('')
    expect(screen.getByLabelText('Date input')).toHaveValue('')
    expect(screen.queryByTestId('timestamp-result')).not.toBeInTheDocument()
  })

  it('enables Share once state differs from defaults', async () => {
    window.history.replaceState({}, '', '/tools/unix-timestamp')
    await setup()
    const shareButton = screen.getByRole('button', { name: 'Share' })
    expect(shareButton).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Timestamp input'), { target: { value: '0' } })
    expect(shareButton).toBeEnabled()
  })

  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })
})
