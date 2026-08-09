import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { charsToCodes, codesToChars, formatCodePointRows, type Direction } from './logic'
import styles from './Tool.module.css'

const DIRECTION_LABELS: Record<Direction, string> = {
  'to-codes': 'To codes (text → code values)',
  'to-chars': 'To chars (codes → text)',
}

type ToolResult = { ok: true; output: string } | { ok: false; error: string }

export function CharacterCodeConverterTool() {
  const [direction, setDirection] = useState<Direction>('to-codes')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ToolResult | null>(null)

  const handleDirectionChange = (value: string) => {
    if (value === 'to-codes' || value === 'to-chars') {
      setDirection(value)
      setResult(null)
    }
  }

  const handleConvert = () => {
    if (direction === 'to-codes') {
      const converted = charsToCodes(input)
      setResult(
        converted.ok ? { ok: true, output: formatCodePointRows(converted.rows) } : converted,
      )
    } else {
      setResult(codesToChars(input))
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
            <option value="to-codes">{DIRECTION_LABELS['to-codes']}</option>
            <option value="to-chars">{DIRECTION_LABELS['to-chars']}</option>
          </select>
        </label>
        <textarea
          className="field"
          aria-label="Code converter input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={direction === 'to-codes' ? 'Aあ😀' : '65, U+3042, 0x1F600'}
          rows={8}
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleConvert}>Convert</Button>
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
          <pre className={styles.output} data-testid="character-code-output">
            {result.output}
          </pre>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Code values will appear here.</p> : null}
      </Panel>
    </div>
  )
}
