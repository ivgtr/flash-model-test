import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel } from '@tool-forge/ui'
import { DEFAULT_MODE, MODE_OPTIONS, parseMode, reverseText, type ReverseMode } from './logic'
import styles from './Tool.module.css'

const MODE_LABELS: Record<ReverseMode, string> = {
  chars: 'Chars (Unicode code points)',
  lines: 'Lines (reverse line order)',
  words: 'Words (reverse word order per line)',
}

export function TextReverserTool() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<ReverseMode>(DEFAULT_MODE)
  const [result, setResult] = useState<string | null>(null)

  const handleModeChange = (value: string) => {
    const parsed = parseMode(value)
    if (parsed !== null) {
      setMode(parsed)
      setResult(null)
    }
  }

  const handleReverse = () => {
    setResult(reverseText(input, mode))
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <label className={styles.modeRow}>
          <span>Mode</span>
          <select
            className="field"
            value={mode}
            onChange={(event) => handleModeChange(event.target.value)}
          >
            {MODE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {MODE_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <textarea
          className="field"
          aria-label="Text to reverse"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'Hello, world!'}
          rows={8}
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleReverse}>Reverse</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={input === '' && result === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output" actions={result !== null ? <CopyButton value={result} /> : undefined}>
        {result !== null ? (
          <pre className={styles.output} data-testid="reverser-output">
            {result}
          </pre>
        ) : null}
        {result === null ? <p className="muted">Reversed text will appear here.</p> : null}
      </Panel>
    </div>
  )
}
