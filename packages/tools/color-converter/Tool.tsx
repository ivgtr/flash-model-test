import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status, useToolUrlState } from '@tool-forge/ui'
import { convertColor, type ColorConvertResult } from './logic'
import { colorConverterStateCodec } from './state'
import styles from './Tool.module.css'

export function ColorConverterTool() {
  const { state, setState, shareUrl, restored } = useToolUrlState(colorConverterStateCodec)
  const [result, setResult] = useState<ColorConvertResult | null>(() =>
    restored && state.input.trim() !== '' ? convertColor(state.input) : null,
  )

  const handleClear = () => {
    setState((prev) => ({ ...prev, input: '' }))
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <input
          className="field"
          aria-label="Color input"
          value={state.input}
          onChange={(event) => setState((prev) => ({ ...prev, input: event.target.value }))}
          placeholder="#ff0000, rgb(255, 0, 0), hsl(0, 100%, 50%)"
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={() => setResult(convertColor(state.input))}>Convert</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={state.input === '' && result === null}
        >
          Clear
        </Button>
        <CopyButton value={shareUrl} label="Share" />
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
