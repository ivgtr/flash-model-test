import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  CONTEXT_OPTIONS,
  DIRECTION_OPTIONS,
  QUOTE_STYLE_OPTIONS,
  escapeText,
  parseContext,
  parseDirection,
  parseQuoteStyle,
  unescapeText,
  type Direction,
  type EscapeContext,
  type EscapeResult,
  type QuoteStyle,
} from './logic'
import styles from './Tool.module.css'

const CONTEXT_LABELS: Record<EscapeContext, string> = {
  html: 'HTML',
  url: 'URL component',
  json: 'JSON string',
  regex: 'Regular expression',
  js: 'JS string',
}

const DIRECTION_LABELS: Record<Direction, string> = {
  escape: 'Escape',
  unescape: 'Unescape',
}

const QUOTE_LABELS: Record<QuoteStyle, string> = {
  single: 'Single quote',
  double: 'Double quote',
}

export function StringEscaperTool() {
  const [input, setInput] = useState('')
  const [context, setContext] = useState<EscapeContext>('html')
  const [direction, setDirection] = useState<Direction>('escape')
  const [quoteStyle, setQuoteStyle] = useState<QuoteStyle>('double')
  const [result, setResult] = useState<EscapeResult | null>(null)

  const handleContextChange = (value: string) => {
    const parsed = parseContext(value)
    if (parsed === null) {
      return
    }
    setContext(parsed)
    if (parsed === 'regex') {
      setDirection('escape')
    }
    setResult(null)
  }

  const handleDirectionChange = (value: string) => {
    const parsed = parseDirection(value)
    if (parsed === null) {
      return
    }
    setDirection(parsed)
    setResult(null)
  }

  const handleQuoteChange = (value: string) => {
    const parsed = parseQuoteStyle(value)
    if (parsed === null) {
      return
    }
    setQuoteStyle(parsed)
    setResult(null)
  }

  const handleConvert = () => {
    if (direction === 'escape') {
      setResult(escapeText(input, context, quoteStyle))
    } else {
      setResult(unescapeText(input, context))
    }
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <label className={styles.selectRow}>
          <span>Context</span>
          <select
            className="field"
            value={context}
            onChange={(event) => handleContextChange(event.target.value)}
          >
            {CONTEXT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {CONTEXT_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.selectRow}>
          <span>Direction</span>
          <select
            className="field"
            value={direction}
            disabled={context === 'regex'}
            onChange={(event) => handleDirectionChange(event.target.value)}
          >
            {DIRECTION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {DIRECTION_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        {context === 'regex' ? (
          <p className={styles.note}>Regular expressions cannot be unescaped; escaping only.</p>
        ) : null}
        <label className={styles.selectRow}>
          <span>Quote style</span>
          <select
            className="field"
            value={quoteStyle}
            disabled={context !== 'js'}
            onChange={(event) => handleQuoteChange(event.target.value)}
          >
            {QUOTE_STYLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {QUOTE_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <textarea
          className="field"
          aria-label="Text input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'<b>Hello</b>'}
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
          <pre className={styles.output} data-testid="string-escaper-output">
            {result.output}
          </pre>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Converted text will appear here.</p> : null}
      </Panel>
    </div>
  )
}
