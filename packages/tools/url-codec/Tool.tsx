import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { decodeUrl, encodeUrl, type UrlResult } from './logic'
import styles from './Tool.module.css'

type Direction = 'encode' | 'decode'

export function UrlCodecTool() {
  const [direction, setDirection] = useState<Direction>('encode')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<UrlResult | null>(null)

  const handleDirectionChange = (value: string) => {
    if (value === 'encode' || value === 'decode') {
      setDirection(value)
      setResult(null)
    }
  }

  const handleConvert = () => {
    if (direction === 'encode') {
      setResult({ ok: true, output: encodeUrl(input) })
    } else {
      setResult(decodeUrl(input))
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
            <option value="encode">Encode (text → percent-encoding)</option>
            <option value="decode">Decode (percent-encoding → text)</option>
          </select>
        </label>
        <textarea
          className="field"
          aria-label="URL input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            direction === 'encode'
              ? 'こんにちは world'
              : '%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF'
          }
          rows={6}
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
          <pre className={styles.output} data-testid="url-output">
            {result.output}
          </pre>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Converted text will appear here.</p> : null}
      </Panel>
    </div>
  )
}
