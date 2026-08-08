import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status, useToolUrlState } from '@tool-forge/ui'
import { decodeFromBase64, encodeToBase64, type Base64Result } from './logic'
import { base64CodecStateCodec } from './state'
import styles from './Tool.module.css'

export function Base64CodecTool() {
  const { state, setState, shareUrl, restored } = useToolUrlState(base64CodecStateCodec)
  const [result, setResult] = useState<Base64Result | null>(() => {
    if (!restored || state.input === '') {
      return null
    }
    return state.direction === 'encode'
      ? { ok: true, output: encodeToBase64(state.input) }
      : decodeFromBase64(state.input)
  })

  const handleDirectionChange = (value: string) => {
    if (value === 'encode' || value === 'decode') {
      setState((prev) => ({ ...prev, direction: value }))
      setResult(null)
    }
  }

  const handleConvert = () => {
    if (state.direction === 'encode') {
      setResult({ ok: true, output: encodeToBase64(state.input) })
    } else {
      setResult(decodeFromBase64(state.input))
    }
  }

  const handleClear = () => {
    setState((prev) => ({ ...prev, input: '' }))
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <label className={styles.directionRow}>
          <span>Direction</span>
          <select
            className="field"
            value={state.direction}
            onChange={(event) => handleDirectionChange(event.target.value)}
          >
            <option value="encode">Encode (text → Base64)</option>
            <option value="decode">Decode (Base64 → text)</option>
          </select>
        </label>
        <textarea
          className="field"
          aria-label="Base64 input"
          value={state.input}
          onChange={(event) => setState((prev) => ({ ...prev, input: event.target.value }))}
          placeholder={state.direction === 'encode' ? 'Hello, world!' : 'SGVsbG8sIHdvcmxkIQ=='}
          rows={8}
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleConvert}>
          {state.direction === 'encode' ? 'Encode' : 'Decode'}
        </Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={state.input === '' && result === null}
        >
          Clear
        </Button>
        <CopyButton value={shareUrl} label="Share" />
      </ActionArea>

      <Panel title="Output" actions={result?.ok ? <CopyButton value={result.output} /> : undefined}>
        {result?.ok ? (
          <pre className={styles.output} data-testid="base64-output">
            {result.output}
          </pre>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Converted text will appear here.</p> : null}
      </Panel>
    </div>
  )
}
