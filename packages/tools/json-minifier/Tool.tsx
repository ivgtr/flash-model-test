import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  DEFAULT_MODE,
  MINIFY_MODES,
  minifyJson,
  parseMode,
  type MinifyJsonResult,
  type MinifyMode,
} from './logic'
import styles from './Tool.module.css'

const MODE_LABELS: Record<MinifyMode, string> = {
  minified: 'Minified',
  pretty: 'Pretty (2 spaces)',
}

export function JsonMinifierTool() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<MinifyMode>(DEFAULT_MODE)
  const [result, setResult] = useState<MinifyJsonResult | null>(null)

  const handleModeChange = (value: string) => {
    const parsed = parseMode(value)
    if (parsed !== null) {
      setMode(parsed)
    }
  }

  const handleMinify = () => {
    setResult(minifyJson(input, mode))
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <textarea
          className="field"
          aria-label="JSON input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder='{"hello": "world"}'
          rows={10}
          spellCheck={false}
        />
        <label className={styles.modeRow}>
          <span>Output mode</span>
          <select
            className="field"
            aria-label="Output mode"
            value={mode}
            onChange={(event) => handleModeChange(event.target.value)}
          >
            {MINIFY_MODES.map((option) => (
              <option key={option} value={option}>
                {MODE_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      </Panel>

      <ActionArea>
        <Button onClick={handleMinify}>Minify</Button>
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
          <>
            <pre className={styles.output} data-testid="json-minifier-output">
              {result.output}
            </pre>
            <p className={styles.stats} data-testid="json-minifier-stats">
              {result.stats.bytesBefore} B → {result.stats.bytesAfter} B (
              {result.stats.savedPercent.toFixed(2)}% saved)
            </p>
          </>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Minified JSON will appear here.</p> : null}
      </Panel>
    </div>
  )
}
