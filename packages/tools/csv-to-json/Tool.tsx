import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  DEFAULT_DELIMITER,
  DELIMITER_OPTIONS,
  convertCsv,
  parseDelimiter,
  type CsvToJsonResult,
  type Delimiter,
} from './logic'
import styles from './Tool.module.css'

const DELIMITER_LABELS: Record<Delimiter, string> = {
  ',': 'Comma (,)',
  ';': 'Semicolon (;)',
  '\t': 'Tab',
}

export function CsvToJsonTool() {
  const [input, setInput] = useState('')
  const [delimiter, setDelimiter] = useState<Delimiter>(DEFAULT_DELIMITER)
  const [result, setResult] = useState<CsvToJsonResult | null>(null)

  const handleDelimiterChange = (value: string) => {
    const parsed = parseDelimiter(value)
    if (parsed !== null) {
      setDelimiter(parsed)
    }
  }

  const handleConvert = () => {
    setResult(convertCsv(input, delimiter))
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <label className={styles.delimiterRow}>
          <span>Delimiter</span>
          <select
            className="field"
            value={delimiter}
            onChange={(event) => handleDelimiterChange(event.target.value)}
          >
            {DELIMITER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {DELIMITER_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <textarea
          className="field"
          aria-label="CSV input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'name,age\nAlice,30'}
          rows={10}
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
          <pre className={styles.output} data-testid="csv-output">
            {result.output}
          </pre>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">JSON will appear here.</p> : null}
      </Panel>
    </div>
  )
}
