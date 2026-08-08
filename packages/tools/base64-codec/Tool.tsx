import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { decodeFromBase64, encodeToBase64, type Base64Result } from './logic'
import styles from './Tool.module.css'

type Direction = 'encode' | 'decode'

export function Base64CodecTool() {
  const [direction, setDirection] = useState<Direction>('encode')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Base64Result | null>(null)

  const handleDirectionChange = (value: string) => {
    if (value === 'encode' || value === 'decode') {
      setDirection(value)
      setResult(null)
    }
  }

  const handleConvert = () => {
    if (direction === 'encode') {
      setResult({ ok: true, output: encodeToBase64(input) })
    } else {
      setResult(decodeFromBase64(input))
    }
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <label className={styles.directionRow}>
          <span>Direction</span>
          <select
            className="field"
            value={direction}
            onChange={(event) => handleDirectionChange(event.target.value)}
          >
            <option value="encode">Encode (text → Base64)</option>
            <option value="decode">Decode (Base64 → text)</option>
          </select>
        </label>
        <textarea
          className="field"
          aria-label="Base64 input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={direction === 'encode' ? 'Hello, world!' : 'SGVsbG8sIHdvcmxkIQ=='}
          rows={8}
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleConvert}>{direction === 'encode' ? 'Encode' : 'Decode'}</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={input === '' && result === null}
        >
          Clear
        </Button>
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
