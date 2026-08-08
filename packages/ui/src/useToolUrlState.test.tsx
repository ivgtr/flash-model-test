import { z, serializeToolState, zodStateCodec, type ToolStateCodec } from '@tool-forge/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useToolUrlState } from './useToolUrlState'

const sampleSchema = z.object({
  input: z.string().default(''),
  indent: z.union([z.literal(0), z.literal(2), z.literal(4)]).default(2),
})

type SampleState = z.infer<typeof sampleSchema>

const sampleCodec: ToolStateCodec<SampleState> = zodStateCodec(sampleSchema, {
  input: '',
  indent: 2,
})

function serializeForUrl(state: SampleState): string {
  const serialized = serializeToolState(state, sampleCodec)
  if (serialized === null) {
    throw new Error('unexpected default state in test helper')
  }
  return serialized
}

function Probe() {
  const { state, setState, shareUrl, restored } = useToolUrlState(sampleCodec)
  return (
    <div>
      <input
        aria-label="input"
        value={state.input}
        onChange={(event) => setState((prev) => ({ ...prev, input: event.target.value }))}
      />
      <span data-testid="indent">{String(state.indent)}</span>
      <span data-testid="restored">{String(restored)}</span>
      <span data-testid="share-url">{shareUrl}</span>
    </div>
  )
}

function seedUrl(search: string) {
  window.history.replaceState({}, '', `/tools/json-formatter${search}`)
}

afterEach(() => {
  window.history.replaceState({}, '', '/')
})

describe('useToolUrlState', () => {
  it('starts with defaults when the URL has no state', () => {
    seedUrl('')
    render(<Probe />)
    expect(screen.getByLabelText('input')).toHaveValue('')
    expect(screen.getByTestId('indent')).toHaveTextContent('2')
    expect(screen.getByTestId('restored')).toHaveTextContent('false')
    expect(screen.getByTestId('share-url')).toHaveTextContent('')
  })

  it('restores state from the URL on mount', () => {
    seedUrl(`/?s=${serializeForUrl({ input: '{"a":1}', indent: 4 })}`)
    render(<Probe />)
    expect(screen.getByLabelText('input')).toHaveValue('{"a":1}')
    expect(screen.getByTestId('indent')).toHaveTextContent('4')
    expect(screen.getByTestId('restored')).toHaveTextContent('true')
  })

  it('falls back to defaults for a malformed state param', () => {
    seedUrl('/?s=1.!!!not-base64!!!')
    render(<Probe />)
    expect(screen.getByLabelText('input')).toHaveValue('')
    expect(screen.getByTestId('indent')).toHaveTextContent('2')
    expect(screen.getByTestId('restored')).toHaveTextContent('false')
  })

  it('does not rewrite the URL while the state changes', () => {
    seedUrl('')
    render(<Probe />)
    fireEvent.change(screen.getByLabelText('input'), { target: { value: 'typed' } })
    expect(window.location.search).toBe('')
  })

  it('exposes a share URL that round-trips the current state', () => {
    seedUrl('')
    const first = render(<Probe />)
    fireEvent.change(screen.getByLabelText('input'), { target: { value: '{"a":1}' } })
    const shareUrl = screen.getByTestId('share-url').textContent
    expect(shareUrl).not.toBe('')
    expect(shareUrl).toContain('s=1.')

    first.unmount()
    const href = new URL(shareUrl!)
    window.history.replaceState({}, '', `${href.pathname}${href.search}`)
    render(<Probe />)
    expect(screen.getByLabelText('input')).toHaveValue('{"a":1}')
    expect(screen.getByTestId('restored')).toHaveTextContent('true')
  })

  it('shows an empty share URL for the default state', () => {
    seedUrl('')
    render(<Probe />)
    expect(screen.getByTestId('share-url')).toHaveTextContent('')
  })
})
