import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { convertColor, type ColorConvertResult } from './logic'
import styles from './Tool.module.css'

export function ColorConverterTool() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ColorConvertResult | null>(null)

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <input
          className="field"
          aria-label="Color input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="#ff0000, rgb(255, 0, 0), hsl(0, 100%, 50%)"
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={() => setResult(convertColor(input))}>Convert</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={input === '' && result === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output">
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result?.ok && !result.empty ? (
          <dl className={styles.rows} data-testid="color-output">
            {(['hex', 'rgb', 'hsl'] as const).map((key) => (
              <div className={styles.row} key={key}>
                <dt className={styles.label}>{key.toUpperCase()}</dt>
                <dd className={styles.value}>{result.converted[key]}</dd>
                <CopyButton value={result.converted[key]} label={`Copy ${key.toUpperCase()}`} />
              </div>
            ))}
          </dl>
        ) : null}
        {result === null || (result.ok && result.empty) ? (
          <p className="muted">Converted color will appear here.</p>
        ) : null}
      </Panel>
    </div>
  )
}
