import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { UserAgentParserTool } from './Tool'

const CHROME_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const UNKNOWN_UA = 'totally-unknown-thing/1.0'

function setUaInput(value: string) {
  fireEvent.change(screen.getByLabelText('User-Agent input'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<UserAgentParserTool />)
  return { user }
}

describe('UserAgentParserTool', () => {
  it('parses a user-agent and shows browser, OS, and device', async () => {
    const { user } = await setup()
    setUaInput(CHROME_WINDOWS)
    await user.click(screen.getByRole('button', { name: 'Analyze' }))
    const output = await screen.findByTestId('ua-parser-output')
    expect(output).toHaveTextContent('Browser: Chrome 131')
    expect(output).toHaveTextContent('OS: Windows 10.0')
    expect(output).toHaveTextContent('Device: desktop')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('parses a Safari mobile UA and shows mobile device class', async () => {
    const { user } = await setup()
    setUaInput(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    )
    await user.click(screen.getByRole('button', { name: 'Analyze' }))
    const output = await screen.findByTestId('ua-parser-output')
    expect(output).toHaveTextContent('Browser: Safari 17')
    expect(output).toHaveTextContent('OS: iOS 17.5')
    expect(output).toHaveTextContent('Device: mobile')
  })

  it('shows Unknown for an unknown UA without crashing', async () => {
    const { user } = await setup()
    setUaInput(UNKNOWN_UA)
    await user.click(screen.getByRole('button', { name: 'Analyze' }))
    const output = await screen.findByTestId('ua-parser-output')
    expect(output).toHaveTextContent('Browser: Unknown')
    expect(output).toHaveTextContent('OS: Unknown')
  })

  it('shows Unknown without crashing for an empty UA', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Analyze' }))
    const output = await screen.findByTestId('ua-parser-output')
    expect(output).toHaveTextContent('Browser: Unknown')
    expect(output).toHaveTextContent('Device: desktop')
  })

  it('flags crawler UAs as robots', async () => {
    const { user } = await setup()
    setUaInput('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
    await user.click(screen.getByRole('button', { name: 'Analyze' }))
    const output = await screen.findByTestId('ua-parser-output')
    expect(output).toHaveTextContent('Browser: Unknown')
    expect(output).toHaveTextContent('Bot: yes')
  })

  it('clears input and output', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('User-Agent input')
    setUaInput(CHROME_WINDOWS)
    await user.click(screen.getByRole('button', { name: 'Analyze' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.getByText(/Parsed result will appear here/)).toBeInTheDocument()
  })
})
