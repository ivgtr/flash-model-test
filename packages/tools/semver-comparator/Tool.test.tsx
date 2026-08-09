import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SemverComparatorTool } from './Tool'

function setVersionA(value: string) {
  fireEvent.change(screen.getByLabelText('Version A'), { target: { value } })
}

function setVersionB(value: string) {
  fireEvent.change(screen.getByLabelText('Version B'), { target: { value } })
}

function setSortInput(value: string) {
  fireEvent.change(screen.getByLabelText('Versions to sort'), { target: { value } })
}

function setVersion(value: string) {
  fireEvent.change(screen.getByLabelText('Version to check'), { target: { value } })
}

function setComparator(value: string) {
  fireEvent.change(screen.getByLabelText('Comparator'), { target: { value } })
}

async function setup() {
  const user = userEvent.setup()
  render(<SemverComparatorTool />)
  return { user }
}

describe('SemverComparatorTool', () => {
  it('compares two versions and shows the relation', async () => {
    const { user } = await setup()
    setVersionA('1.2.3')
    setVersionB('1.4.0')
    await user.click(screen.getByRole('button', { name: 'Compare' }))
    const output = await screen.findByTestId('compare-output')
    expect(output).toHaveTextContent('1.2.3 < 1.4.0')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('shows equality for identical versions', async () => {
    const { user } = await setup()
    setVersionA('v1.2.3')
    setVersionB('1.2.3+build')
    await user.click(screen.getByRole('button', { name: 'Compare' }))
    const output = await screen.findByTestId('compare-output')
    expect(output).toHaveTextContent('v1.2.3 = 1.2.3+build')
  })

  it('shows a visible error for an invalid version and no output', async () => {
    const { user } = await setup()
    setVersionA('01.2.3')
    setVersionB('1.2.3')
    await user.click(screen.getByRole('button', { name: 'Compare' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('leading zero')
    expect(screen.queryByTestId('compare-output')).not.toBeInTheDocument()
  })

  it('sorts versions ascending and descending', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Mode'), 'sort')
    setSortInput('3.0.0\n1.0.0-beta\n2.0.0\n1.0.0')
    await user.click(screen.getByRole('button', { name: 'Sort' }))
    const output = await screen.findByTestId('sort-output')
    expect(output).toHaveTextContent('1.0.0-beta\n1.0.0\n2.0.0\n3.0.0', {
      normalizeWhitespace: false,
    })
    await user.selectOptions(screen.getByLabelText('Sort direction'), 'desc')
    await user.click(screen.getByRole('button', { name: 'Sort' }))
    expect(output).toHaveTextContent('3.0.0\n2.0.0\n1.0.0\n1.0.0-beta', {
      normalizeWhitespace: false,
    })
  })

  it('shows a visible error when a sort line is invalid', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Mode'), 'sort')
    setSortInput('1.0.0\nnot-a-version')
    await user.click(screen.getByRole('button', { name: 'Sort' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid SemVer')
    expect(screen.queryByTestId('sort-output')).not.toBeInTheDocument()
  })

  it('checks a version against a range comparator', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Mode'), 'range')
    setVersion('1.2.3')
    setComparator('>=1.0.0')
    await user.click(screen.getByRole('button', { name: 'Check' }))
    const output = await screen.findByTestId('range-output')
    expect(output).toHaveTextContent('1.2.3 satisfies >=1.0.0')
    setComparator('>=2.0.0')
    await user.click(screen.getByRole('button', { name: 'Check' }))
    expect(output).toHaveTextContent('1.2.3 does not satisfy >=2.0.0')
  })

  it('shows a visible error for an invalid comparator', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Mode'), 'range')
    setVersion('1.2.3')
    setComparator('1.2.3')
    await user.click(screen.getByRole('button', { name: 'Check' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('must start with')
    expect(screen.queryByTestId('range-output')).not.toBeInTheDocument()
  })

  it('clears all inputs and the result', async () => {
    const { user } = await setup()
    setVersionA('1.2.3')
    setVersionB('1.4.0')
    await user.click(screen.getByRole('button', { name: 'Compare' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByLabelText('Version A')).toHaveValue('')
    expect(screen.getByLabelText('Version B')).toHaveValue('')
    expect(screen.getByText(/Result will appear here/)).toBeInTheDocument()
  })
})
