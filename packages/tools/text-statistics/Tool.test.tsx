import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TextStatisticsTool } from './Tool'

function setInput(value: string) {
  fireEvent.change(screen.getByLabelText('Text input'), { target: { value } })
}

describe('TextStatisticsTool', () => {
  it('updates the statistics as the user types', () => {
    render(<TextStatisticsTool />)
    setInput('hello world')
    const stats = screen.getByTestId('text-statistics')
    expect(stats).toHaveTextContent('Characters')
    expect(stats).toHaveTextContent('11')
    expect(stats).toHaveTextContent('Words')
    expect(stats).toHaveTextContent('2')
    expect(stats).toHaveTextContent('Lines')
    expect(stats).toHaveTextContent('1')
  })

  it('shows zeros for empty input', () => {
    render(<TextStatisticsTool />)
    const stats = screen.getByTestId('text-statistics')
    expect(stats).toHaveTextContent('Characters')
    expect(stats).toHaveTextContent('0')
    expect(stats).toHaveTextContent('Words')
    expect(stats).toHaveTextContent('0')
    expect(stats).toHaveTextContent('Lines')
    expect(stats).toHaveTextContent('0')
  })

  it('updates in real time on subsequent input', () => {
    render(<TextStatisticsTool />)
    setInput('a')
    setInput('a b c')
    const stats = screen.getByTestId('text-statistics')
    expect(stats).toHaveTextContent('5')
    expect(stats).toHaveTextContent('3')
  })
})
