import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  DEFAULT_DELIMITER,
  DEFAULT_QUOTE_STYLE,
  DELIMITER_OPTIONS,
  QUOTE_STYLE_OPTIONS,
  formatCsv,
  parseDelimiter,
  parseQuoteStyle,
  type Delimiter,
  type FormatResult,
  type QuoteStyle,
} from './logic'
import styles from './Tool.module.css'

const DELIMITER_LABELS: Record<Delimiter, string> = {
  ',': 'Comma (,)',
  ';': 'Semicolon (;)',
  '\t': 'Tab',
}

const QUOTE_STYLE_LABELS: Record<QuoteStyle, string> = {
  'only-when-needed': 'Only when needed',
  always: 'Always',
}

export function CsvFormatterTool() {
  const [input, setInput] = useState('')
  const [delimiter, setDelimiter] = useState<Delimiter>(DEFAULT_DELIMITER)
  const [quoteStyle, setQuoteStyle] = useState<QuoteStyle>(DEFAULT_QUOTE_STYLE)
  const [trim, setTrim] = useState(false)
  const [removeBlankLines, setRemoveBlankLines] = useState(false)
  const [result, setResult] = useState<FormatResult | null>(null)

  const handleDelimiterChange = (value: string) => {
    const parsed = parseDelimiter(value)
    if (parsed !== null) {
      setDelimiter(parsed)
    }
  }

  const handleQuoteStyleChange = (value: string) => {
    const parsed = parseQuoteStyle(value)
    if (parsed !== null) {
      setQuoteStyle(parsed)
    }
  }

  const handleFormat = () => {
    setResult(
      formatCsv(input, {
        delimiter,
        quoteStyle,
        trim,
        removeBlankLines,
      }),
    )
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <div className={styles.optionsRow}>
          <label className={styles.fieldRow}>
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
          <label className={styles.fieldRow}>
            <span>Quote style</span>
            <select
              className="field"
              value={quoteStyle}
              onChange={(event) => handleQuoteStyleChange(event.target.value)}
            >
              {QUOTE_STYLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {QUOTE_STYLE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.toggleRow}>
          <label className={styles.fieldRow}>
            <input
              type="checkbox"
              checked={trim}
              onChange={(event) => setTrim(event.target.checked)}
            />
            <span>Trim field values</span>
          </label>
          <label className={styles.fieldRow}>
            <input
              type="checkbox"
              checked={removeBlankLines}
              onChange={(event) => setRemoveBlankLines(event.target.checked)}
            />
            <span>Remove blank lines</span>
          </label>
        </div>
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
        <Button onClick={handleFormat}>Format</Button>
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
          <pre className={styles.output} data-testid="csv-formatter-output">
            {result.output}
          </pre>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Formatted CSV will appear here.</p> : null}
      </Panel>
    </div>
  )
}
